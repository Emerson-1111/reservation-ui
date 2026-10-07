using System.ComponentModel.DataAnnotations;

namespace ReservationApi.Models
{
    public class Appointment
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio")]
        [MinLength(3, ErrorMessage = "El nombre debe tener al menos 3 caracteres")]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        public string ServiceName { get; set; } = string.Empty;

        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }

        // El token para evitar que dos personas reserven a la vez
        public byte[]? RowVersion { get; set; }
    }
}