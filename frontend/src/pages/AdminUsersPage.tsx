import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Modal, Form } from 'react-bootstrap';
import { getAllUsers, assignUniversityAdmin, assignEditorByAdmin } from '../api/adminApi';
import { useNavigate } from 'react-router-dom';
import { getAllUniversities } from '../api/universityApi';
import { UniversityResponse } from '../types';

const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [show, setShow] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [universityId, setUniversityId] = useState<string | undefined>(undefined);
    const [universities, setUniversities] = useState<UniversityResponse[]>([]);

    const navigate = useNavigate();

    useEffect(() => { load(); loadUniversities(); }, []);

    const load = async () => {
        const data = await getAllUsers();
        setUsers(data);
    };

    const loadUniversities = async () => {
        try {
            const data = await getAllUniversities();
            setUniversities(data);
        } catch (e) {
            console.error('Failed to load universities', e);
        }
    };

    const openAssign = (user: any) => { setSelectedUser(user); setShow(true); };

    const doAssign = async () => {
        if (!selectedUser) return;
        // assign as university editor (not site admin)
        await assignEditorByAdmin(selectedUser.id, universityId ? Number(universityId) : undefined);
        setShow(false);
        setUniversityId('');
        await load();
    };

    return (
        <Container className="mt-4">
            <h4>Управление пользователями (админ вуза)</h4>
            <Table striped bordered hover>
                <thead>
                    <tr><th>ID</th><th>Email</th><th>Имя</th><th>Роль</th><th>Университеты</th><th>Действия</th></tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.email}</td>
                            <td>{u.firstName}</td>
                            <td>{u.role}</td>
                            <td>{
                                u.universityIds && u.universityIds.length > 0 ?
                                    u.universityIds.map((id: number) => {
                                        const uni = universities.find(x => x.id === id);
                                        return uni ? uni.fullName || (uni as any).abbreviation || id : id;
                                    }).join(', ') : '-'
                            }</td>
                            <td>
                                <Button size="sm" onClick={() => openAssign(u)}>Назначить редактором вуза</Button>{' '}
                                {u.role === 'ROLE_UNIVERSITY_ADMIN' && u.universityIds && u.universityIds.length > 0 && (
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        const uniId = u.universityIds[0];
                                        navigate(`/university-admin/editors?universityId=${uniId}`);
                                    }}>Управлять редакторами</Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton><Modal.Title>Назначить редактором вуза</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Выберите университет (обязательно)</Form.Label>
                        <Form.Select
                            value={universityId ?? ''}
                            onChange={(e) => setUniversityId(e.target.value ? e.target.value : undefined)}
                        >
                            <option value="">-- Выберите университет --</option>
                            {universities.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.fullName ? `${u.fullName} (${(u as any).abbreviation || u.id})` : `${(u as any).abbreviation || 'University'} (${u.id})`}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>Отмена</Button>
                    <Button onClick={doAssign}>Назначить</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminUsersPage;
