import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createFaculty, updateFaculty } from '../../api/facultyApi';
import { FacultyResponse } from '../../types';

interface Props {
    show: boolean;
    onHide: () => void;
    faculty: FacultyResponse | null;
    universityId?: number;
    onSaved?: () => void;
}

const FacultyForm: React.FC<Props> = ({ show, onHide, faculty, universityId, onSaved }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        setName((faculty as any)?.fullName || '');
        setDescription((faculty as any)?.abbreviation || '');
    }, [faculty]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (faculty) {
                const uniId = (faculty as any).universityId ?? (faculty as any).university?.id;
                await updateFaculty(faculty.id, { fullName: name, abbreviation: description, universityId: uniId });
            } else {
                if (!universityId) throw new Error('universityId required');
                await createFaculty({ fullName: name, abbreviation: description, universityId });
            }
            if (onSaved) onSaved();
        } catch (err) {
            console.error('Failed saving faculty', err);
            // Try to show server message if present
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyErr: any = err;
            let message = 'Ошибка при сохранении факультета';
            if (anyErr?.response?.data) {
                try {
                    const data = anyErr.response.data;
                    if (typeof data === 'string') message += `: ${data}`;
                    else if (data.message) message += `: ${data.message}`;
                    else message += ` (status ${anyErr.response.status})`;
                } catch (e) {
                    // ignore
                }
            } else if (anyErr?.message) {
                message += `: ${anyErr.message}`;
            }
            alert(message);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>{faculty ? 'Изменить факультет' : 'Добавить факультет'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Название</Form.Label>
                        <Form.Control value={name} onChange={e => setName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Описание</Form.Label>
                        <Form.Control as="textarea" value={description} onChange={e => setDescription(e.target.value)} />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={onHide} className="me-2">Отмена</Button>
                        <Button type="submit">Сохранить</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default FacultyForm;
