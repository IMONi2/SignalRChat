using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Lab3V2.Hubs;
using System.Text.Json.Serialization.Metadata;

var builder = WebApplication.CreateBuilder(args);

// Lägg till CORS för att tillåta React att ansluta
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactCors", policy =>
    {
        policy.WithOrigins("http://localhost:50591")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        
        options.PayloadSerializerOptions.TypeInfoResolver = new DefaultJsonTypeInfoResolver();
    });

builder.Services.AddControllers();

var app = builder.Build();

app.UseCors("ReactCors");

app.UseRouting();

// Registrera SignalR-hubben
app.MapHub<ChatHub>("/chatHub");

// Registrera API-kontroller
app.MapControllers();

app.Run();
