using Microsoft.AspNetCore.SignalR;
using Lab3V2.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Lab3V2.Hubs
{
    public class ChatHub : Hub
    {
        private static readonly List<ChatMessage> GeneralMessages = new List<ChatMessage>();
        private static readonly List<ChatMessage> TeacherMessages = new List<ChatMessage>();

        public async Task GetMessages(string channel)
        {
            List<ChatMessage> messagesToSend = channel switch
            {
                "general" => GeneralMessages.TakeLast(50).ToList(),
                "teacher" => TeacherMessages.TakeLast(50).ToList(),
                _ => new List<ChatMessage>()
            };

            foreach (var msg in messagesToSend)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", msg);
            }
        }
        public async Task SendMessage(string channel, string user, string role, string message)
        {
            var chatMessage = new ChatMessage
            {
                User = user,
                Role = role,
                Message = message,
                Channel = channel
            };

            if (channel == "general")
            {
                GeneralMessages.Add(chatMessage);
            }
            else if (channel == "teacher")
            {
                TeacherMessages.Add(chatMessage);
            }
            // Håll meddelandelistan inom de senaste 50
            if (GeneralMessages.Count > 50)
                GeneralMessages.RemoveAt(0);
            if (TeacherMessages.Count > 50)
                TeacherMessages.RemoveAt(0);

            await Clients.All.SendAsync("ReceiveMessage", chatMessage);
        }
    }
}
