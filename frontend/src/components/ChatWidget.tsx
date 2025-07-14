import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Button, Form, InputGroup, ListGroup, Card } from 'react-bootstrap';
import { FiMessageSquare, FiSend, FiX } from 'react-icons/fi';
import './ChatWidget.css';

interface ChatMessage {
    user: string;
    response: {
        status: string;
        data?: Array<{ [key: string]: any }>;
        comment?: string;
        message?: string;
    };
}

const ChatWidget: React.FC = () => {
    // Вызываем хуки в начале компонента
    const authContext = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Проверка контекста и авторизации
    if (!authContext || !authContext.isAuthenticated) {
        return null;
    }
    const { token } = authContext;

    // Открытие/закрытие виджета
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    // Отправка сообщения
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !token) return;

        setIsLoading(true);
        try {
            const response = await axios.post(
                '/api/assistant/query',
                message,
                {
                    headers: {
                        'Content-Type': 'text/plain',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setChatHistory([...chatHistory, { user: message, response: response.data }]);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            setChatHistory([
                ...chatHistory,
                {
                    user: message,
                    response: { status: 'error', message: 'Ошибка при отправке запроса к GigaChat.' },
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-widget">
            {!isOpen && (
                <Button variant="primary" className="chat-toggle" onClick={toggleChat}>
                    <FiMessageSquare size={24} />
                </Button>
            )}
            {isOpen && (
                <Card className="chat-window">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <Card.Title>Чат с GigaChat</Card.Title>
                        <Button variant="link" onClick={toggleChat}>
                            <FiX size={20} />
                        </Button>
                    </Card.Header>
                    <Card.Body className="chat-body">
                        {isLoading && <div style={{ textAlign: 'center' }}>Загрузка...</div>}
                        <ListGroup className="chat-messages">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className="chat-message">
                                    <div className="user-message">
                                        <strong>Вы:</strong> {msg.user}
                                    </div>
                                    <div className="bot-response">
                                        <strong>GigaChat:</strong>{' '}
                                        {msg.response.status === 'success' && msg.response.data ? (
                                            <>
                                                <ul>
                                                    {msg.response.data.map((item, i) => (
                                                        <li key={i}>
                                                            {Object.entries(item).map(([key, value]) => (
                                                                <span key={key}>
                                  {key}: {value};{' '}
                                </span>
                                                            ))}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {msg.response.comment && <p>{msg.response.comment}</p>}
                                            </>
                                        ) : (
                                            <p>{msg.response.message || 'Ошибка при получении ответа.'}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </ListGroup>
                    </Card.Body>
                    <Card.Footer>
                        <Form onSubmit={handleSendMessage}>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Задайте вопрос..."
                                    disabled={isLoading}
                                />
                                <Button variant="primary" type="submit" disabled={isLoading}>
                                    <FiSend size={16} />
                                </Button>
                            </InputGroup>
                        </Form>
                    </Card.Footer>
                </Card>
            )}
        </div>
    );
};

export default ChatWidget;