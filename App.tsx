
import React, { useState, useMemo, useEffect } from 'react';

interface FormData {
  nome: string;
  whatsapp: string;
  email: string;
}

interface EventSlot {
  id: string;
  dateTime: string;
}

interface EventDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  paymentLinkSufix: string;
  slots: EventSlot[];
  customScheduling?: boolean;
}

const initialMockEventsData: EventDetails[] = [
  {
    id: 'evento_padrao',
    name: 'Selecione um Evento',
    description: 'Escolha uma das Rodas de Cura para ver os horários.',
    price: 0,
    paymentLinkSufix: 'PADRAO',
    slots: [],
  },
  {
    id: 'relacionamento',
    name: 'Roda de Cura Online - Relacionamento Afetivo',
    description: 'Harmonize e cure seus laços afetivos. Encontre equilíbrio e amor em suas conexões.',
    price: 40,
    paymentLinkSufix: 'RELACIONAMENTO_AFETIVO',
    slots: Array.from({ length: 8 }, (_, i) => ({
      id: `rel_slot_${i + 1}`,
      dateTime: `${String(i + 1).padStart(2, '0')}/07/2024 - ${10 + i}:00` // Example: 01/07/2024 for i=0
    })),
  },
  {
    id: 'libertacao',
    name: 'Roda de Cura Online - Libertação Espiritual',
    description: 'Liberte-se de amarras energéticas e padrões limitantes. Encontre paz e clareza espiritual.',
    price: 40,
    paymentLinkSufix: 'LIBERTACAO_ESPIRITUAL',
    slots: Array.from({ length: 8 }, (_, i) => ({
      id: `lib_slot_${i + 1}`,
      dateTime: `${String(i + 1).padStart(2, '0')}/07/2024 - ${10 + i}:30`
    })),
  },
  {
    id: 'saude',
    name: 'Roda de Cura Online - Saúde Física e Emocional',
    description: 'Promova bem-estar integral para corpo e mente. Fortaleça sua vitalidade e equilíbrio emocional.',
    price: 40,
    paymentLinkSufix: 'SAUDE_FISICA_EMOCIONAL',
    slots: Array.from({ length: 8 }, (_, i) => ({
      id: `sau_slot_${i + 1}`,
      dateTime: `${String(i + 8).padStart(2, '0')}/07/2024 - ${10 + i}:00` // Example: 08/07/2024 for i=0
    })),
  },
  {
    id: 'prosperidade',
    name: 'Roda de Cura Online - Caminhos da Prosperidade',
    description: 'Abra seus caminhos para a abundância e realização. Conecte-se com a energia da prosperidade.',
    price: 40,
    paymentLinkSufix: 'CAMINHOS_PROSPERIDADE',
    slots: Array.from({ length: 8 }, (_, i) => ({
      id: `pro_slot_${i + 1}`,
      dateTime: `${String(i + 8).padStart(2, '0')}/07/2024 - ${10 + i}:30`
    })),
  },
  {
    id: 'sessao_individual',
    name: 'Sessão Individual Online',
    description: 'Uma sessão personalizada para suas necessidades específicas. O agendamento será feito após a inscrição.',
    price: 200,
    paymentLinkSufix: 'SESSAO_INDIVIDUAL',
    slots: [],
    customScheduling: true,
  },
];

const getWeekdayShort = (dateTimeString: string): string => {
  if (!dateTimeString || !dateTimeString.includes(' - ') || !dateTimeString.includes('/')) return '';
  const parts = dateTimeString.split(' - ');
  if (parts.length < 2) return '';
  const datePart = parts[0];
  const dateComponents = datePart.split('/');
  if (dateComponents.length < 3) return '';

  const day = parseInt(dateComponents[0], 10);
  const month = parseInt(dateComponents[1], 10); // 1-indexed
  const year = parseInt(dateComponents[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) return '';

  const dateObj = new Date(year, month - 1, day); // Month is 0-indexed for Date constructor
  
  // Verify that the created date matches the input, e.g. new Date(2023, 1, 30) (Feb 30) doesn't become March 2nd
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
      return ''; // Invalid date like 30/02/2024
  }
  if (isNaN(dateObj.getTime())) return '';


  let weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
  weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  if (weekday.endsWith('.')) { // Remove trailing dot from "seg.", "ter.", etc.
    weekday = weekday.slice(0, -1);
  }
  return weekday; // Returns "Seg", "Ter", etc.
};

const formatSlotWithWeekdayForDisplay = (dateTimeString: string): string => {
  const weekday = getWeekdayShort(dateTimeString);
  return weekday ? `${weekday}, ${dateTimeString}` : dateTimeString;
};


const App: React.FC = () => {
  const [eventsData, setEventsData] = useState<EventDetails[]>(initialMockEventsData);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventsData[0].id);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    whatsapp: '',
    email: '',
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Admin State
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [editingSlotData, setEditingSlotData] = useState<{[eventId: string]: string}>({});


  useEffect(() => {
    const currentSelectedEvent = eventsData.find(event => event.id === selectedEventId);
    if (!currentSelectedEvent) {
        setSelectedEventId(eventsData[0].id);
        setSelectedSlotId(null);
    } else if (selectedSlotId && !currentSelectedEvent.customScheduling) {
        const currentSelectedSlot = currentSelectedEvent.slots.find(slot => slot.id === selectedSlotId);
        if(!currentSelectedSlot) {
            setSelectedSlotId(null);
        }
    }
  }, [eventsData, selectedEventId, selectedSlotId]);


  const selectedEvent = useMemo(() => {
    return eventsData.find(event => event.id === selectedEventId) || eventsData[0];
  }, [selectedEventId, eventsData]);

  const selectedSlot = useMemo(() => {
    if (selectedEvent.customScheduling) return null;
    return selectedEvent.slots.find(slot => slot.id === selectedSlotId) || null;
  }, [selectedEvent, selectedSlotId]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEventId(e.target.value);
    setSelectedSlotId(null);
    setFormData({ nome: '', whatsapp: '', email: '' });
    setIsSubmitted(false);
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
    setFormData({ nome: '', whatsapp: '', email: '' });
    setIsSubmitted(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanWhatsApp = formData.whatsapp.replace(/\D/g, '');
    console.log('Form data submitted:', {
      event: selectedEvent.name,
      slot: selectedEvent.customScheduling ? 'Agendamento Posterior' : (selectedSlot ? formatSlotWithWeekdayForDisplay(selectedSlot.dateTime) : ''),
      ...formData,
      whatsappLink: `https://wa.me/55${cleanWhatsApp}` 
    });
    setIsSubmitted(true);
  };

  const handleNewRegistration = () => {
    setSelectedEventId(eventsData[0].id);
    setSelectedSlotId(null);
    setFormData({ nome: '', whatsapp: '', email: '' });
    setIsSubmitted(false);
  };

  const showForm = selectedEventId !== eventsData[0].id && (selectedSlotId || selectedEvent.customScheduling);

  // Admin Functions
  const handleAdminLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'admin') {
      setIsAdminView(true);
      setShowAdminLoginModal(false);
      setAdminLoginError(null);
      setAdminCredentials({ username: '', password: '' });
    } else {
      setAdminLoginError('Usuário ou senha inválidos.');
    }
  };

  const handleAdminEventChange = (eventId: string, field: keyof EventDetails, value: string | number) => {
    setEventsData(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, [field]: field === 'price' ? Number(value) : value } : event
      )
    );
  };
  
  const handleAdminSlotDateTimeChange = (eventId: string, slotId: string, newDateTime: string) => {
    setEventsData(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? {
              ...event,
              slots: event.slots.map(slot =>
                slot.id === slotId ? { ...slot, dateTime: newDateTime } : slot
              ),
            }
          : event
      )
    );
  };

  const handleAddSlot = (eventId: string) => {
    const newSlotDateTime = editingSlotData[eventId]?.trim();
    if (!newSlotDateTime) return;
     // Basic validation for DD/MM/YYYY - HH:MM format
    if (!/^\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}$/.test(newSlotDateTime)) {
        alert("Formato de data/hora inválido. Use DD/MM/AAAA - HH:MM");
        return;
    }


    setEventsData(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? {
              ...event,
              slots: [...event.slots, { id: `slot_${Date.now()}`, dateTime: newSlotDateTime }],
            }
          : event
      )
    );
    setEditingSlotData(prev => ({...prev, [eventId]: ''})); 
  };

  const handleRemoveSlot = (eventId: string, slotIdToRemove: string) => {
    setEventsData(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, slots: event.slots.filter(slot => slot.id !== slotIdToRemove) }
          : event
      )
    );
  };

  const handleEditingSlotDataChange = (eventId: string, value: string) => {
    setEditingSlotData(prev => ({...prev, [eventId]: value}));
  };


  // Render Admin View
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8 font-sans">
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-purple-700">Painel Administrativo</h1>
            <button
              onClick={() => setIsAdminView(false)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors"
            >
              Sair do Admin e Voltar à Inscrição
            </button>
          </header>

          <div className="space-y-8">
            {eventsData.filter(event => event.id !== 'evento_padrao').map(event => (
              <div key={event.id} className="p-6 bg-purple-50 rounded-lg shadow-md border border-purple-200">
                <h2 className="text-xl font-semibold text-purple-700 mb-4">Editando: {event.name}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor={`name-${event.id}`} className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento:</label>
                    <input
                      type="text"
                      id={`name-${event.id}`}
                      value={event.name}
                      onChange={(e) => handleAdminEventChange(event.id, 'name', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor={`price-${event.id}`} className="block text-sm font-medium text-gray-700 mb-1">Preço (R$):</label>
                    <input
                      type="number"
                      id={`price-${event.id}`}
                      value={event.price}
                      onChange={(e) => handleAdminEventChange(event.id, 'price', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor={`description-${event.id}`} className="block text-sm font-medium text-gray-700 mb-1">Descrição:</label>
                  <textarea
                    id={`description-${event.id}`}
                    value={event.description}
                    rows={3}
                    onChange={(e) => handleAdminEventChange(event.id, 'description', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  />
                </div>

                {!event.customScheduling && (
                  <div>
                    <h3 className="text-lg font-medium text-purple-600 mb-2">Horários:</h3>
                    {event.slots.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {event.slots.map(slot => (
                          <li key={slot.id} className="flex items-center justify-between p-2 bg-white rounded-md border">
                            <span className="text-xs text-gray-500 mr-1 w-12 text-right">
                                ({getWeekdayShort(slot.dateTime)})
                            </span>
                            <input 
                              type="text"
                              value={slot.dateTime}
                              onChange={(e) => handleAdminSlotDateTimeChange(event.id, slot.id, e.target.value)}
                              className="flex-grow px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm mr-2"
                              placeholder="DD/MM/AAAA - HH:MM"
                            />
                            <button
                              onClick={() => handleRemoveSlot(event.id, slot.id)}
                              className="text-red-500 hover:text-red-700 font-medium text-sm"
                              aria-label={`Remover horário ${slot.dateTime}`}
                            >
                              Remover
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-gray-500 mb-2 text-sm">Nenhum horário cadastrado.</p>}
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingSlotData[event.id] || ''}
                        onChange={(e) => handleEditingSlotDataChange(event.id, e.target.value)}
                        placeholder="Ex: 25/12/2024 - 15:00"
                        className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                      />
                      <button
                        onClick={() => handleAddSlot(event.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm text-sm"
                      >
                        Adicionar Horário
                      </button>
                    </div>
                  </div>
                )}
                {event.customScheduling && (
                    <p className="text-sm text-gray-600 italic">Esta é uma sessão com agendamento personalizado. Não há horários para gerenciar aqui.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render User View
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-red-200 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-2xl transition-all duration-500 ease-in-out">
        {!isSubmitted ? (
          <>
            <header className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
                Inscrição - Rodas de Cura Online
              </h1>
            </header>
            <section className="mb-6">
              <label htmlFor="event-select" className="block text-lg font-medium text-purple-700 mb-2">
                1. Escolha o Evento ou Sessão:
              </label>
              <select
                id="event-select"
                value={selectedEventId}
                onChange={handleEventChange}
                className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-150"
                aria-label="Selecione um Evento ou Sessão"
              >
                {eventsData.map(event => (
                  <option key={event.id} value={event.id} disabled={event.id === 'evento_padrao' && selectedEventId !== 'evento_padrao'}>
                    {event.name}
                  </option>
                ))}
              </select>
            </section>

            {selectedEventId !== eventsData[0].id && (
              <>
                <section className="mb-8 p-6 bg-purple-50 rounded-lg shadow-md border border-purple-200">
                  <h2 className="text-xl font-semibold text-purple-700 mb-2">{selectedEvent.name}</h2>
                  <p className="text-gray-600 mb-3">{selectedEvent.description}</p>
                  <p className="text-lg font-semibold text-purple-700">
                    <strong className="text-purple-600">Valor da Inscrição:</strong> R$ {selectedEvent.price.toFixed(2)}
                  </p>
                </section>

                {!selectedEvent.customScheduling ? (
                  <section className="mb-6">
                    <h3 className="block text-lg font-medium text-purple-700 mb-3">
                      2. Escolha Data e Horário:
                    </h3>
                    {selectedEvent.slots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedEvent.slots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot.id)}
                            className={`p-3 border rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ease-in-out
                              ${selectedSlotId === slot.id
                                ? 'bg-pink-500 text-white ring-2 ring-pink-600 ring-offset-1 shadow-lg'
                                : 'bg-white text-purple-700 hover:bg-pink-100 border-purple-300 hover:shadow-md'
                              }`}
                            aria-pressed={selectedSlotId === slot.id}
                          >
                            {formatSlotWithWeekdayForDisplay(slot.dateTime)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Não há horários disponíveis para este evento no momento.</p>
                    )}
                  </section>
                ) : (
                  <section className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-md">
                     <h3 className="block text-lg font-medium text-purple-700 mb-2">
                      2. Agendamento da Sessão:
                    </h3>
                    <p>O agendamento da sua Sessão Individual Online será realizado por nossa equipe de atendimento após a confirmação da sua inscrição.</p>
                    <p>Entraremos em contato pelo WhatsApp ou e-mail fornecido.</p>
                  </section>
                )}
              </>
            )}

            {showForm && (
              <form id="formulario" onSubmit={handleSubmit} className="space-y-6 mt-8">
                 <h3 className="block text-lg font-medium text-purple-700 mb-1">
                    3. Seus Dados para Inscrição:
                  </h3>
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome completo:</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-150"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (com DDD):</label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-150"
                    placeholder="(XX) XXXXX-XXXX"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition-colors duration-150"
                    placeholder="seuemail@exemplo.com"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-150 ease-in-out transform hover:scale-105"
                  disabled={!formData.nome || !formData.whatsapp || !formData.email}
                  aria-disabled={!formData.nome || !formData.whatsapp || !formData.email}
                >
                  Enviar Pedido de Inscrição
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div id="confirmacao" className="p-4 sm:p-6 bg-green-50 border-l-4 border-green-500 rounded-md shadow-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-md font-semibold text-green-700">Seu pedido de inscrição foi enviado com sucesso!</p>
                  <div className="mt-2 text-sm text-green-600">
                    <p><strong>Evento:</strong> {selectedEvent.name}</p>
                    <p><strong>Data/Hora:</strong> {selectedEvent.customScheduling ? 'A definir (agendamento posterior pela equipe)' : (selectedSlot ? formatSlotWithWeekdayForDisplay(selectedSlot.dateTime) : '')}</p>
                    <p><strong>Nome:</strong> {formData.nome}</p>
                     <p>
                      <strong>WhatsApp:</strong>{' '}
                      <a
                        href={`https://wa.me/55${formData.whatsapp.replace(/\D/g, '')}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {formData.whatsapp}
                      </a>
                    </p>
                    <p><strong>E-mail:</strong> {formData.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="pagamento" className="p-4 sm:p-6 bg-blue-50 border-l-4 border-blue-500 rounded-md shadow-md text-center sm:text-left">
               <div className="flex flex-col sm:flex-row items-center mb-3">
                <div className="flex-shrink-0 mb-3 sm:mb-0 sm:mr-3">
                  <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <p className="text-md font-medium text-blue-700">Para confirmar sua participação, efetue o pagamento de R$ {selectedEvent.price.toFixed(2)}:</p>
                </div>
              </div>
              <div id="link-pagamento" className="mt-4 text-center">
                <a
                  href="https://loja.infinitepay.io/camposutil/vpx7737-roda-de-cura-com-gert-folz-jr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 px-8 rounded-md shadow-lg text-decoration-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 ease-in-out transform hover:scale-105"
                  aria-label={`Efetuar Pagamento de R$ ${selectedEvent.price.toFixed(2)}`}
                >
                  Efetuar Pagamento de R$ {selectedEvent.price.toFixed(2)}
                </a>
              </div>
            </div>

            <button
              onClick={handleNewRegistration}
              className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-150 ease-in-out"
            >
              Fazer Nova Inscrição
            </button>
          </div>
        )}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Rodas de Cura Online & Sessões Individuais. Todos os direitos reservados.</p>
          {!isAdminView && (
             <button
                onClick={() => { setAdminLoginError(null); setShowAdminLoginModal(true); }}
                className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Acesso Administrativo
              </button>
          )}
        </footer>
      </div>

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-2xl font-bold text-purple-700 mb-6 text-center">Login Administrativo</h2>
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700">Usuário:</label>
                <input
                  type="text"
                  id="admin-username"
                  name="username"
                  value={adminCredentials.username}
                  onChange={handleAdminLoginChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">Senha:</label>
                <input
                  type="password"
                  id="admin-password"
                  name="password"
                  value={adminCredentials.password}
                  onChange={handleAdminLoginChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              {adminLoginError && <p className="text-sm text-red-600">{adminLoginError}</p>}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
