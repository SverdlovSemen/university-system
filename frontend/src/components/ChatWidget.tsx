import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios, { AxiosError } from 'axios'; // Import AxiosError
import { Button, Form, InputGroup, ListGroup, Card, FormSelect, Table, Badge, Alert } from 'react-bootstrap';
import { FiMessageSquare, FiSend, FiX } from 'react-icons/fi';
import { ResizableBox } from 'react-resizable';
import { useNavigate } from 'react-router-dom';
import 'react-resizable/css/styles.css';
import './ChatWidget.css';

interface ChatMessage {
    user: string;
    response: {
        status: string;
        data?: Array<{ [key: string]: any } | string>;
        comment?: string;
        message?: string;
        data_type?: string;
    };
}

const ChatWidget: React.FC = () => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState('GigaChat-2-Pro');
    const [visibleItems, setVisibleItems] = useState<{ [key: number]: number }>({});
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 350, height: 500 });

    useEffect(() => {
        if (isOpen && chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

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
                                    .map((item) =>
                                        typeof item === 'string'
                                            ? item
                                            : Object.entries(item)
                                                .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
                                                .toString()
                                    )
                                    .join('; ')
                                : '',
                            comment: msg.response.comment || msg.response.message || 'Ответ от GigaChat',
                            data_type: msg.response.data_type || '',
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
            setVisibleItems((prev) => ({ ...prev, [chatHistory.length]: 20 }));
        } catch (error) {
            // Type error as AxiosError
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error('Error sending message:', axiosError.response?.data || axiosError.message);
            setChatHistory([
                ...chatHistory,
                {
                    user: message,
                    response: {
                        status: 'error',
                        message: axiosError.response?.data?.message || 'Ошибка при отправке запроса к GigaChat.',
                    },
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowMore = (index: number) => {
        setVisibleItems((prev) => ({
            ...prev,
            [index]: (prev[index] || 20) + 20,
        }));
    };

    const renderResponse = (response: ChatMessage['response'], index: number) => {
        if (response.status === 'error') {
            return <Alert variant="danger">{response.message || 'Ошибка при получении ответа.'}</Alert>;
        }

        if (!response.data || !response.data_type) {
            return <p>{response.comment || 'Нет данных для отображения.'}</p>;
        }

        switch (response.data_type) {
            case 'regions':
            case 'cities':
            case 'faculties':
            case 'subjects':
                return (
                    <div>
                        <p>
                            <strong>
                                {response.data_type === 'regions'
                                    ? 'Регионы'
                                    : response.data_type === 'cities'
                                        ? 'Города'
                                        : response.data_type === 'faculties'
                                            ? 'Факультеты'
                                            : 'Предметы'}
                                :
                            </strong>
                        </p>
                        <ul>
                            {(response.data as string[])
                                .slice(0, visibleItems[index] || 20)
                                .map((item: string, i: number) => (
                                    <li key={i}>{item}</li>
                                ))}
                        </ul>
                        {response.data.length > (visibleItems[index] || 20) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="show-more-btn"
                                onClick={() => handleShowMore(index)}
                            >
                                Показать ещё
                            </Button>
                        )}
                        {response.comment && <p className="mt-2">{response.comment}</p>}
                    </div>
                );
            case 'universities':
            case 'favorite_universities':
                return (
                    <div>
                        <p>
                            <strong>{response.data_type === 'universities' ? 'Вузы' : 'Избранные вузы'}:</strong>
                        </p>
                        {response.data.length === 0 ? (
                            <p>У вас нет избранных вузов.</p>
                        ) : (
                            <Table striped bordered hover className="chat-table">
                                <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Проходной балл</th>
                                </tr>
                                </thead>
                                <tbody>
                                {(response.data as Array<{ short_name: string; full_name: string; avg_ege_score: number }>)
                                    .slice(0, visibleItems[index] || 20)
                                    .map((uni, i) => (
                                        <tr key={i}>
                                            <td>
                                                <a
                                                    href={`/university/${uni.short_name}`}
                                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate(`/university/${uni.short_name}`);
                                                    }}
                                                >
                                                    {uni.full_name} ({uni.short_name})
                                                </a>
                                            </td>
                                            <td>{uni.avg_ege_score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                        {response.data.length > (visibleItems[index] || 20) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="show-more-btn"
                                onClick={() => handleShowMore(index)}
                            >
                                Показать ещё
                            </Button>
                        )}
                        {response.comment && <p className="mt-2">{response.comment}</p>}
                    </div>
                );
            case 'specialties':
            case 'favorite_specialties':
            case 'faculty_specialties':
                return (
                    <div>
                        <p>
                            <strong>
                                {response.data_type === 'specialties'
                                    ? 'Специальности'
                                    : response.data_type === 'favorite_specialties'
                                        ? 'Избранные специальности'
                                        : 'Специальности факультета'}
                                :
                            </strong>
                        </p>
                        {response.data.length === 0 ? (
                            <p>У вас нет избранных специальностей.</p>
                        ) : (
                            <ListGroup>
                                {(response.data as Array<{ name: string; program_code: string; description: string }>)
                                    .slice(0, visibleItems[index] || 20)
                                    .map((specialty, i) => (
                                        <ListGroup.Item key={i}>
                                            <strong>{specialty.name}</strong> (Код: {specialty.program_code})<br />
                                            {specialty.description}
                                        </ListGroup.Item>
                                    ))}
                            </ListGroup>
                        )}
                        {response.data.length > (visibleItems[index] || 20) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="show-more-btn"
                                onClick={() => handleShowMore(index)}
                            >
                                Показать ещё
                            </Button>
                        )}
                        {response.comment && <p className="mt-2">{response.comment}</p>}
                    </div>
                );
            case 'subject_combinations':
                return (
                    <div>
                        <p><strong>Комбинации предметов:</strong></p>
                        <ListGroup>
                            {(response.data as Array<{ combination_id: number; subjects: string[] }>)
                                .slice(0, visibleItems[index] || 20)
                                .map((combo, i) => (
                                    <ListGroup.Item key={i}>
                                        Комбинация #{combo.combination_id}: {combo.subjects.join(', ')}
                                    </ListGroup.Item>
                                ))}
                        </ListGroup>
                        {response.data.length > (visibleItems[index] || 20) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="show-more-btn"
                                onClick={() => handleShowMore(index)}
                            >
                                Показать ещё
                            </Button>
                        )}
                        {response.comment && <p className="mt-2">{response.comment}</p>}
                    </div>
                );
            case 'specialty_subjects':
                return (
                    <div>
                        <p><strong>Специальности и их предметы:</strong></p>
                        <Table striped bordered hover className="chat-table">
                            <thead>
                            <tr>
                                <th>Специальность</th>
                                <th>Требуемые предметы</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(response.data as Array<{ name: string; program_code: string; required_subjects: string[] }>)
                                .slice(0, visibleItems[index] || 20)
                                .map((specialty, i) => (
                                    <tr key={i}>
                                        <td>
                                            <a
                                                href={`/specialty/${specialty.name.replace(/\s+/g, '-')}`}
                                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigate(`/specialty/${specialty.name.replace(/\s+/g, '-')}`);
                                                }}
                                            >
                                                {specialty.name} (Код: {specialty.program_code})
                                            </a>
                                        </td>
                                        <td>
                                            {specialty.required_subjects.map((subject: string, j: number) => (
                                                <Badge key={j} bg="info" className="me-1">
                                                    {subject}
                                                </Badge>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        {response.data.length > (visibleItems[index] || 20) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="show-more-btn"
                                onClick={() => handleShowMore(index)}
                            >
                                Показать ещё
                            </Button>
                        )}
                        {response.comment && <p className="mt-2">{response.comment}</p>}
                    </div>
                );
            default:
                return (
                    <ul>
                        {(response.data as Array<string | { [key: string]: any }>).map((item, i) => (
                            <li key={i}>
                                {typeof item === 'string' ? (
                                    item
                                ) : (
                                    Object.entries(item).map(([key, value]) => (
                                        <span key={key}>
                                            {key}: {String(value)};{' '}
                                        </span>
                                    ))
                                )}
                            </li>
                        ))}
                    </ul>
                );
        }
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
                                            <strong>GigaChat:</strong> {renderResponse(msg.response, index)}
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