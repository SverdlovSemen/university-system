import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Modal, Form } from 'react-bootstrap';
import { getAllUsers, assignEditorByAdmin } from '../api/adminApi';
import { getAllUniversities } from '../api/universityApi';
import { useAuth } from '../hooks/useAuth';
import { UniversityResponse } from '../types';

const UniversityAdminUsersPage: React.FC = () => {
    const { user } = useAuth();
    const myUniversityId = user?.universityIds?.[0];

    const [users, setUsers] = useState<any[]>([]);
    const [show, setShow] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [universities, setUniversities] = useState<UniversityResponse[]>([]);
    const [universityId, setUniversityId] = useState<number | undefined>(myUniversityId);

    useEffect(() => { load(); loadUniversities(); }, []);

    const load = async () => {
        const data = await getAllUsers();
        setUsers(data);
    };

    const loadUniversities = async () => {
        try {
            const data = await getAllUniversities();
            setUniversities(data);
            if (!universityId && data.length > 0 && myUniversityId) setUniversityId(myUniversityId);
        } catch (e) {
            console.error(e);
        }
    };

    const openAssign = (u: any) => { setSelectedUser(u); setShow(true); };

    const doAssign = async () => {
        if (!selectedUser) return;
        if (!universityId) { alert('Выберите университет'); return; }
        await assignEditorByAdmin(selectedUser.id, universityId);
        setShow(false);
        await load();
    };

    return (
        <Container className="mt-4">
            <h4>Управление пользователями (админ университета)</h4>
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
                            <td>{u.universityIds && u.universityIds.length > 0 ?
                                u.universityIds.map((id: number) => {
                                    const uni = universities.find(x => x.id === id);
                                        return uni ? uni.fullName || (uni as any).abbreviation || id : id;
                                }).join(', ') : '-'
                            }</td>
                            <td>
                                <Button size="sm" onClick={() => openAssign(u)}>Назначить редактором вуза</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton><Modal.Title>Назначить редактором вуза</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Выберите университет</Form.Label>
                        <Form.Select value={universityId ?? ''} onChange={e => setUniversityId(e.target.value ? Number(e.target.value) : undefined)}>
                            <option value="">-- Выберите университет --</option>
                            {universities.map(u => (
                                <option key={u.id} value={u.id}>{u.fullName || (u as any).abbreviation}</option>
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

export default UniversityAdminUsersPage;
