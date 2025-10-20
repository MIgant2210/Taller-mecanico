import React, { useState, useEffect } from "react";
import { Users, Car, PlusCircle, Search, Edit2, Trash2, X, Mail, Phone, MapPin, Calendar } from "lucide-react";
import Table from "../components/Table";
import Form from "../components/Form";
import { api } from "../services/api";

const Clients = () => {
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "clients") {
        const response = await api.get("/clientes");
        setClients(response.data);
      } else {
        const response = await api.get("/vehiculos");
        setVehicles(response.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const clientColumns = [
    { 
      key: "nombres", 
      title: "Cliente",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
            {row.nombres?.charAt(0)}{row.apellidos?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value} {row.apellidos}</p>
            <p className="text-xs text-gray-500">{row.dpi || 'Sin DPI'}</p>
          </div>
        </div>
      )
    },
    { 
      key: "telefono", 
      title: "Contacto",
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-blue-500" />
            <span className="text-gray-700">{value}</span>
          </div>
          {row.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 text-xs">{row.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: "direccion",
      title: "Dirección",
      render: (value) => (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 line-clamp-2">{value || 'No registrada'}</span>
        </div>
      )
    },
    {
      key: "fecha_registro",
      title: "Registro",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {new Date(value).toLocaleDateString("es-ES", { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
      )
    },
  ];

  const vehicleColumns = [
    { 
      key: "placa", 
      title: "Vehículo",
      render: (value, row) => (
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-md text-sm border-2 border-blue-300">
              {value}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{row.numero_chasis || 'Sin chasis'}</p>
        </div>
      )
    },
    { 
      key: "marca", 
      title: "Marca/Modelo",
      render: (value, row) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600">{row.modelo} {row.año && `(${row.año})`}</p>
        </div>
      )
    },
    { 
      key: "color", 
      title: "Color",
      render: (value) => (
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
          <div className="w-3 h-3 rounded-full border-2 border-gray-300" style={{ backgroundColor: value?.toLowerCase() || '#ccc' }}></div>
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: "kilometraje",
      title: "Kilometraje",
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? `${value.toLocaleString()} km` : 'N/A'}
        </span>
      )
    },
    {
      key: "cliente",
      title: "Propietario",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
            {value?.nombres?.charAt(0)}{value?.apellidos?.charAt(0)}
          </div>
          <span className="text-sm text-gray-700">
            {value ? `${value.nombres} ${value.apellidos}` : "N/A"}
          </span>
        </div>
      )
    },
  ];

  const clientFields = [
    { name: "nombres", label: "Nombres", type: "text", required: true },
    { name: "apellidos", label: "Apellidos", type: "text", required: true },
    { name: "dpi", label: "DPI", type: "text" },
    { name: "telefono", label: "Teléfono", type: "text", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "direccion", label: "Dirección", type: "textarea", fullWidth: true },
  ];

  const vehicleFields = [
    {
      name: "id_cliente",
      label: "Cliente",
      type: "select",
      required: true,
      options: clients.map((c) => ({
        value: c.id_cliente,
        label: `${c.nombres} ${c.apellidos}`,
      })),
    },
    { name: "marca", label: "Marca", type: "text", required: true },
    { name: "modelo", label: "Modelo", type: "text", required: true },
    { name: "año", label: "Año", type: "number" },
    { name: "placa", label: "Placa", type: "text", required: true },
    { name: "color", label: "Color", type: "text" },
    { name: "numero_chasis", label: "Número de Chasis", type: "text" },
    { name: "numero_motor", label: "Número de Motor", type: "text" },
    { name: "kilometraje", label: "Kilometraje", type: "number", min: 0 },
  ];

  const handleSubmit = async (formData) => {
    try {
      if (activeTab === "clients") {
        if (editingItem) {
          await api.put(`/clientes/${editingItem.id_cliente}`, formData);
        } else {
          await api.post("/clientes", formData);
        }
      } else {
        if (editingItem) {
          await api.put(`/vehiculos/${editingItem.id_vehiculo}`, formData);
        } else {
          await api.post("/vehiculos", formData);
        }
      }
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error al guardar los datos");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
    try {
      if (activeTab === "clients") {
        await api.delete(`/clientes/${item.id_cliente}`);
      } else {
        await api.delete(`/vehiculos/${item.id_vehiculo}`);
      }
      loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error al eliminar el registro");
    }
  };

  // Filtrado de datos
  const filteredData = () => {
    const data = activeTab === "clients" ? clients : vehicles;
    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      if (activeTab === "clients") {
        return (
          item.nombres?.toLowerCase().includes(searchLower) ||
          item.apellidos?.toLowerCase().includes(searchLower) ||
          item.telefono?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower)
        );
      } else {
        return (
          item.placa?.toLowerCase().includes(searchLower) ||
          item.marca?.toLowerCase().includes(searchLower) ||
          item.modelo?.toLowerCase().includes(searchLower) ||
          item.cliente?.nombres?.toLowerCase().includes(searchLower)
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                {activeTab === "clients" ? (
                  <>
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Users className="w-7 h-7 text-blue-600" />
                    </div>
                    Gestión de Clientes
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Car className="w-7 h-7 text-blue-600" />
                    </div>
                    Gestión de Vehículos
                  </>
                )}
              </h1>
              <p className="text-gray-600">
                {activeTab === "clients"
                  ? "Administra la información de tus clientes"
                  : "Gestiona los vehículos asociados a tus clientes"}
              </p>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <PlusCircle className="w-5 h-5" />
              Nuevo {activeTab === "clients" ? "Cliente" : "Vehículo"}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === "clients"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Users className="w-5 h-5" /> 
              Clientes
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {clients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("vehicles")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === "vehicles"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Car className="w-5 h-5" /> 
              Vehículos
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {vehicles.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === "clients" ? "cliente por nombre, teléfono o email" : "vehículo por placa, marca o modelo"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all animate-scale-in">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar {activeTab === "clients" ? "Cliente" : "Vehículo"}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Nuevo {activeTab === "clients" ? "Cliente" : "Vehículo"}
                    </>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                <Form
                  fields={activeTab === "clients" ? clientFields : vehicleFields}
                  initialData={editingItem || {}}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  submitText={editingItem ? "Actualizar" : "Crear"}
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Cargando datos...</p>
            </div>
          ) : filteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                {activeTab === "clients" ? (
                  <Users className="w-12 h-12 text-gray-400" />
                ) : (
                  <Car className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <p className="text-lg font-medium">
                {searchTerm 
                  ? "No se encontraron resultados" 
                  : `No hay ${activeTab === "clients" ? "clientes" : "vehículos"} registrados`}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm 
                  ? "Intenta con otros términos de búsqueda"
                  : `Comienza agregando un nuevo ${activeTab === "clients" ? "cliente" : "vehículo"}`}
              </p>
            </div>
          ) : (
            <Table
              data={filteredData()}
              columns={activeTab === "clients" ? clientColumns : vehicleColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;