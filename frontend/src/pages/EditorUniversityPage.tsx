import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Row, Col, ListGroup, Modal } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';
import { getUniversityById, updateUniversity } from '../api/universityApi';
import { getFacultiesByUniversity, createFaculty, updateFaculty, deleteFaculty } from '../api/facultyApi';
import FacultyForm from '../components/editor/FacultyForm';
import SpecialtyForm from '../components/editor/SpecialtyForm';
import { UniversityResponse, UniversityRequest, FacultyResponse, SpecialtyResponse } from '../types';

const EditorUniversityPage: React.FC = () => {
    const { user, token } = useAuth();
    const universityId = user?.universityIds?.[0];

    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [faculties, setFaculties] = useState<FacultyResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState<FacultyResponse | null>(null);

    const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
    const [currentFacultyForSpecialties, setCurrentFacultyForSpecialties] = useState<FacultyResponse | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!universityId) return;
            setLoading(true);
            try {
                const uni = await getUniversityById(universityId);
                setUniversity(uni);
                const facs = await getFacultiesByUniversity(universityId);
                setFaculties(facs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [universityId]);

    const handleSaveUniversity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!university) return;
        const payload: UniversityRequest = {
            id: university.id,
            fullName: university.fullName,
            abbreviation: (university as any).abbreviation || '',
            type: university.type,
            ownershipType: (university as any).ownershipType,
            cityId: university.city?.id || 0,
            foundedYear: (university as any).foundedYear,
            website: (university as any).website,
            adminEmail: (university as any).adminEmail,
            adminPhone: (university as any).adminPhone,
            accreditationNumber: (university as any).accreditationNumber,
            accreditationExpiryDate: (university as any).accreditationExpiryDate
        };
        try {
            await updateUniversity(university.id, payload);
            alert('Информация об университете обновлена');
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении');
        }
    };

    const openCreateFaculty = () => {
        setEditingFaculty(null);
        setShowFacultyModal(true);
    };

    const openEditFaculty = (faculty: FacultyResponse) => {
        setEditingFaculty(faculty);
        setShowFacultyModal(true);
    };

    const handleDeleteFaculty = async (id: number) => {
        // eslint-disable-next-line no-restricted-globals
        if (!window.confirm('Удалить факультет?')) return;
        try {
            await deleteFaculty(id);
            setFaculties(faculties.filter(f => f.id !== id));
        } catch (e) {
            console.error(e);
            alert('Не удалось удалить факультет');
        }
    };

    const handleFacultySaved = async () => {
        if (!universityId) return;
        const facs = await getFacultiesByUniversity(universityId);
        setFaculties(facs);
        setShowFacultyModal(false);
    };

    const openManageSpecialties = (faculty: FacultyResponse) => {
        setCurrentFacultyForSpecialties(faculty);
        setShowSpecialtyModal(true);
    };

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5">Управление университетом</Card.Header>
                <Card.Body>
                    {!universityId && <p>Вы не прикреплены ни к одному университету.</p>}
                    {university && (
                        <Form onSubmit={handleSaveUniversity}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Короткое название (аббревиатура)</Form.Label>
                                        <Form.Control value={(university as any).abbreviation || ''} onChange={(e) => setUniversity({ ...university, abbreviation: e.target.value } as any)} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Тип</Form.Label>
                                        <Form.Control value={university.type} onChange={(e) => setUniversity({ ...university, type: e.target.value })} />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button type="submit" className="mb-3">Сохранить</Button>
                        </Form>
                    )}

                    <hr />

                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6>Факультеты</h6>
                        <div>
                            <Button onClick={openCreateFaculty}>Добавить факультет</Button>
                        </div>
                    </div>

                    <ListGroup>
                        {faculties.map(f => (
                            <ListGroup.Item key={f.id} className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{(f as any).fullName || (f as any).abbreviation || 'Факультет'}</strong>
                                    <div className="text-muted">{(f as any).abbreviation || ''}</div>
                                </div>
                                <div>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEditFaculty(f)}>Изменить</Button>
                                    <Button variant="outline-danger" size="sm" className="me-2" onClick={() => handleDeleteFaculty(f.id)}>Удалить</Button>
                                    <Button variant="secondary" size="sm" onClick={() => openManageSpecialties(f)}>Программы</Button>
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>

                </Card.Body>
            </Card>

            <FacultyForm
                show={showFacultyModal}
                onHide={() => setShowFacultyModal(false)}
                faculty={editingFaculty}
                universityId={universityId}
                onSaved={handleFacultySaved}
            />

            <Modal show={showSpecialtyModal} onHide={() => setShowSpecialtyModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Программы факультета {(currentFacultyForSpecialties as any)?.fullName || (currentFacultyForSpecialties as any)?.abbreviation || ''}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentFacultyForSpecialties && (
                        <SpecialtyForm universityId={universityId} facultyId={currentFacultyForSpecialties.id} onClose={() => { setShowSpecialtyModal(false); }} />
                    )}
                </Modal.Body>
            </Modal>

        </Container>
    );
};

export default EditorUniversityPage;
