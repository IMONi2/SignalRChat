import React, { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import "./index.css";

const Chat = () => {
    const [connection, setConnection] = useState(null);
    const [name, setName] = useState("");
    const [role, setRole] = useState("student");
    const [joined, setJoined] = useState(false);
    const [message, setMessage] = useState("");
    const [generalMessages, setGeneralMessages] = useState([]);
    const [teacherMessages, setTeacherMessages] = useState([]);
    const [error, setError] = useState(null);

    const MAX_MESSAGES = 50;

    // Initiera SignalR-anslutningen
    useEffect(() => {
        const conn = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5166/chatHub")
            .withAutomaticReconnect()
            .build();
        setConnection(conn);
    }, []);

    // Starta anslutningen
    useEffect(() => {
        if (!connection || !joined) return;
        connection.start()
            .then(() => {
                // Hämta gamla meddelanden vid anslutning
                connection.invoke("GetMessages", "general");
                connection.invoke("GetMessages", "teacher");

                connection.on("ReceiveMessage", (msg) => {
                    if (msg.channel === "general") {
                        setGeneralMessages(prev => {
                            const updated = [...prev, msg];
                            return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
                        });
                    } else if (msg.channel === "teacher") {
                        setTeacherMessages(prev => {
                            const updated = [...prev, msg];
                            return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
                        });
                    }
                });

                connection.on("ReceiveError", (err) => {
                    setError(err.text || err);
                    setTimeout(() => setError(null), 3000);
                });
            })
            .catch(console.error);
    }, [connection, joined]);

    const handleJoin = () => {
        if (!name.trim()) return alert("Ange ett namn");
        setJoined(true);
    };

    const sendMessage = async (channel) => {
        if (!message.trim() || !connection) return;
        try {
            await connection.invoke("SendMessage", channel, name, role, message);
            setMessage("");
        } catch (err) {
            console.error(err);
        }
    };

    // Inloggningsvy
    if (!joined) {
        return (
            <div className="join-container">
                <h2>Anslut till chatten</h2>
                <input
                    placeholder="Ditt namn"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="teacher">Lärare</option>
                </select>
                <button onClick={handleJoin}>Gå med</button>
            </div>
        );
    }

    return (
        <div className="chat-wrapper">
            <h2>
                Välkommen, {name} ({role === "teacher" ? "Lärare" : "Student"})
            </h2>

            {error && <div className="error-box">{error}</div>}
            {/*Allmän chat*/}
            <div className="chat-container">
                <div className="chat-box chat-general">
                    <div className="chat-header">Allmän chatt</div>
                    <div className="chat-messages">
                        {generalMessages.map((m, i) => (
                            <div key={i} className="chat-message">
                                <strong>{m.user} ({m.role})</strong>: {m.message}
                            </div>
                        ))}
                    </div>
                </div>

                {/*Lärar uttalanden */}
                <div className="chat-box chat-teacher">
                    <div className="chat-header">Announcements</div>
                    <div className="chat-messages">
                        {teacherMessages.map((m, i) => (
                            <div key={i} className="chat-message">
                                <strong>{m.user} ({m.role})</strong>: {m.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="chat-input-area">
                <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                />
                <button
                    className="btn-general"
                    onClick={() => sendMessage("general")}
                >
                    Skicka allmänt
                </button>
                {role === "teacher" && (
                    <button
                        className="btn-teacher"
                        onClick={() => sendMessage("teacher")}
                    >
                        Skicka announcement
                    </button>
                )}
            </div>
        </div>
    );
};

export default Chat;
