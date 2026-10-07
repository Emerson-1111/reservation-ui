using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ReservationApi.Data;
using ReservationApi.Models;
using ReservationApi.Hubs;

namespace ReservationApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ReservationHub> _hubContext;

        public AppointmentsController(AppDbContext context, IHubContext<ReservationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAppointments()
        {
            var appointments = await _context.Appointments.ToListAsync();
            return Ok(appointments);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment(Appointment appointment)
        {
            // Normalizar a UTC para consistencia con SQLite y el frontend
            appointment.StartTime = appointment.StartTime.ToUniversalTime();
            appointment.EndTime = appointment.EndTime.ToUniversalTime();

            if (appointment.StartTime >= appointment.EndTime)
            {
                return BadRequest("La hora de inicio debe ser anterior a la hora de finalización.");
            }

            // Margen de gracia de 2 minutos para evitar rechazos si el usuario tarda unos segundos en llenar el formulario
            if (appointment.StartTime < DateTime.UtcNow.AddMinutes(-2))
            {
                return BadRequest("No puedes hacer una reserva en el pasado.");
            }

            // Lógica de superposición: Si una cita existente termina DESPUÉS de que la nueva empieza,
            // Y la cita existente empieza ANTES de que la nueva termine, entonces chocan.
            bool isConflict = await _context.Appointments.AnyAsync(a =>
                a.StartTime < appointment.EndTime && a.EndTime > appointment.StartTime);

            if (isConflict)
            {
                // Devuelve un error 400 (Bad Request) que tu frontend capturará y mostrará en el alert/toast
                return BadRequest("El horario seleccionado ya está ocupado. Por favor, elige otro.");
            }

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveNewAppointment", appointment);
            return Ok(appointment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound("La reserva no existe.");
            }

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveDeletedAppointment", id);

            return Ok();
        }
    }
}