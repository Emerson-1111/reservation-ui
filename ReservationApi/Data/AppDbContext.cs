using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using ReservationApi.Models;

namespace ReservationApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Appointment> Appointments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Conversor para almacenar y recuperar DateTime siempre en UTC en SQLite
            var dateTimeConverter = new ValueConverter<DateTime, string>(
                v => (v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime())
                    .ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                v => DateTime.Parse(v, null, System.Globalization.DateTimeStyles.RoundtripKind)
            );

            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.Property(a => a.StartTime)
                    .HasConversion(dateTimeConverter);

                entity.Property(a => a.EndTime)
                    .HasConversion(dateTimeConverter);

                // Configurar el control de concurrencia
                entity.Property(a => a.RowVersion)
                    .IsRowVersion();
            });
        }
    }
}