import React, { useEffect, useState } from 'react';
import { Container, ListGroup, Button, Form } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { getUniversityEditors, assignEditorToUniversity, removeEditorFromUniversity } from '../api/adminApi';

const UniversityEditorsPage: React.FC = () => {
    const { user } = useAuth();
    // allow passing universityId via query param (site admin managing any university)
    const params = new URLSearchParams(window.location.search);
    const queryUniId = params.get('universityId');
    const universityId = queryUniId ? Number(queryUniId) : user?.universityIds?.[0];
    const [editors, setEditors] = useState<any[]>([]);
    const [inviteUserId, setInviteUserId] = useState('');

    useEffect(() => { if (universityId) load(); }, [universityId]);

    const load = async () => {
        if (!universityId) return;
        const data = await getUniversityEditors(universityId);
        setEditors(data);
    };

    const invite = async () => {
        if (!universityId) return;
        await assignEditorToUniversity(universityId, Number(inviteUserId));
        setInviteUserId('');
        await load();
    };

    const removeEditor = async (userId: number) => {
        if (!universityId) return;
        await removeEditorFromUniversity(universityId, userId);
        await load();
    };

    return (
        <Container className="mt-4">
            <h4>Редакторы университета</h4>
            {!universityId && <p>Вы не прикреплены к университету.</p>}
            {universityId && (
                <>
                    <div className="mb-3 d-flex">
                        <Form.Control placeholder="User ID to invite" value={inviteUserId} onChange={e => setInviteUserId(e.target.value)} className="me-2" />
                        <Button onClick={invite}>Пригласить</Button>
                    </div>
                    <ListGroup>
                        {editors.map(e => (
                            <ListGroup.Item key={e.id} className="d-flex justify-content-between align-items-center">
                                <div>{e.firstName} ({e.email})</div>
                                <Button variant="outline-danger" size="sm" onClick={() => removeEditor(e.id)}>Удалить</Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </>
            )}
        </Container>
    );
};

export default UniversityEditorsPage;
