import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Button, Form, InputGroup, ListGroup, Card, FormSelect } from 'react-bootstrap';
import { FiMessageSquare, FiSend, FiX } from 'react-icons/fi';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
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
    const authContext = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState('GigaChat-2-Pro');
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 350, height: 500 });

    // Scroll to the latest message
    useEffect(() => {
        if (isOpen && chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

    // Load saved size from localStorage
    useEffect(() => {
        const savedSize = localStorage.getItem('chatSize');
        if (savedSize) {
            setSize(JSON.parse(savedSize));
        }
    }, []);

    if (!authContext || !authContext.isAuthenticated) {
        return null;
    }
    const { token } = authContext;

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !token) return;

        setIsLoading(true);
        try {
            const messages = [
                ...chatHistory.map((msg) => [
                    { role: 'user', content: msg.user },
                    {
                        role: 'assistant',
                        content: JSON.stringify({
                            sql: msg.response.data
                                ? msg.response.data
                                    .map((item) => Object.entries(item).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}))
                                    .join('; ')
                                : '',
                            comment: msg.response.comment || msg.response.message || 'Ответ от GigaChat',
                        }),
                    },
                ]).flat(),
                { role: 'user', content: message },
            ];

            const response = await axios.post(
                '/api/assistant/query',
                { messages, model },
                {
                    headers: {
                        'Content-Type': 'application/json',
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

    const handleResize = (event: any, { size }: { size: { width: number; height: number } }) => {
        setSize(size);
        localStorage.setItem('chatSize', JSON.stringify(size));
    };

    return (
        <div className="chat-widget">
            {!isOpen && (
                <Button variant="primary" className="chat-toggle" onClick={toggleChat} title="Открыть чат">
                    <FiMessageSquare size={24} />
                </Button>
            )}
            {isOpen && (
                <ResizableBox
                    width={size.width}
                    height={size.height}
                    minConstraints={[300, 300]}
                    maxConstraints={[1000, 1000]}
                    className="chat-resizable"
                    resizeHandles={['nw']}
                    onResize={(event, { size: newSize }) => {
                        setSize({
                            width: Math.max(newSize.width, 300),
                            height: Math.max(newSize.height, 300),
                        });
                        localStorage.setItem('chatSize', JSON.stringify({
                            width: Math.max(newSize.width, 300),
                            height: Math.max(newSize.height, 300),
                        }));
                    }}
                >
                    <Card className="chat-window">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <Card.Title>Чат с GigaChat</Card.Title>
                            <Button variant="link" onClick={toggleChat} title="Закрыть чат">
                                <FiX size={20} />
                            </Button>
                        </Card.Header>
                        <Card.Body className="chat-body" ref={chatBodyRef}>
                            <Form.Group className="mb-3">
                                <Form.Label>Выберите модель</Form.Label>
                                <FormSelect value={model} onChange={(e) => setModel(e.target.value)}>
                                    <option value="GigaChat-2-Pro">GigaChat Pro</option>
                                    <option value="GigaChat-2-Max">GigaChat Max</option>
                                    <option value="GigaChat-2">GigaChat Lite</option>
                                </FormSelect>
                            </Form.Group>
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
                                    <Button variant="primary" type="submit" disabled={isLoading} title="Отправить">
                                        <FiSend size={16} />
                                    </Button>
                                </InputGroup>
                            </Form>
                        </Card.Footer>
                    </Card>
                </ResizableBox>
            )}
        </div>
    );
};

export default ChatWidget;