import React, { useEffect, useState } from 'react';
import { Button, ListGroup, Modal, Form } from 'react-bootstrap';
import { fetchSpecialtiesByUniversity, createSpecialty, updateSpecialty, deleteSpecialty, getSpecialtyById } from '../../api/specialtyApi';
import { SpecialtyResponse } from '../../types';

interface Props {
    universityId?: number;
    facultyId: number;
    onClose?: () => void;
}

const SpecialtyForm: React.FC<Props> = ({ universityId, facultyId, onClose }) => {
    const [specialties, setSpecialties] = useState<SpecialtyResponse[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editing, setEditing] = useState<SpecialtyResponse | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [programCode, setProgramCode] = useState('');

    const load = async () => {
        if (!universityId) return;
        const data = await fetchSpecialtiesByUniversity(universityId, facultyId);
        setSpecialties(data);
    };

    useEffect(() => { load(); }, [universityId, facultyId]);

    const openCreate = () => {
        setEditing(null);
        setName('');
        setDescription('');
        setShowEditModal(true);
    };

    const openEdit = async (s: SpecialtyResponse) => {
        setEditing(s);
        setName(s.name);
        setDescription(s.description || '');
        setProgramCode((s as any).programCode || '');
        setShowEditModal(true);
    };

    const handleDelete = async (id: number) => {
        // eslint-disable-next-line no-restricted-globals
        if (!window.confirm('Удалить программу?')) return;
        try {
            await deleteSpecialty(id);
            await load();
        } catch (e) {
            console.error(e);
            alert('Не удалось удалить программу');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await updateSpecialty(editing.id, { name, programCode: programCode || (editing as any).programCode || '', description, facultyIds: [facultyId] });
            } else {
                if (!universityId) throw new Error('universityId required');
                // Ensure programCode is provided to satisfy backend validation
                const code = programCode && programCode.trim() !== '' ? programCode : `P-${Date.now()}`;
                await createSpecialty({ name, programCode: code, description, facultyIds: [facultyId] });
            }
            setShowEditModal(false);
            await load();
        } catch (e: any) {
            console.error(e);
            const msg = e?.response?.data?.message || e?.response?.data || e?.message || 'Ошибка при сохранении программы';
            alert(msg);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between mb-2">
                <h6>Список программ</h6>
                <Button onClick={openCreate} size="sm">Добавить программу</Button>
            </div>
            <ListGroup>
                {specialties.map(s => (
                    <ListGroup.Item key={s.id} className="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>{s.name}</strong>
                        </div>
                        <div>
                            <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEdit(s)}>Изменить</Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(s.id)}>Удалить</Button>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{editing ? 'Изменить программу' : 'Добавить программу'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSave}>
                        <Form.Group className="mb-3">
                            <Form.Label>Название</Form.Label>
                            <Form.Control value={name} onChange={e => setName(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Код программы</Form.Label>
                            <Form.Control value={programCode} onChange={e => setProgramCode(e.target.value)} placeholder="Номер/код программы" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Описание</Form.Label>
                            <Form.Control as="textarea" value={description} onChange={e => setDescription(e.target.value)} />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={() => setShowEditModal(false)} className="me-2">Отмена</Button>
                            <Button type="submit">Сохранить</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default SpecialtyForm;
