import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Wallet, 
  PieChart as PieChartIcon, 
  Search, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { getGastos, addGasto, deleteGasto } from './services/gastosService';

const CATEGORIAS = ['Alimentación', 'Servicios', 'Educación', 'Vehículo', 'Salud', 'Entretenimiento', 'Varios'];
const INTEGRANTES = ['Sergio', 'Familia', 'Agostina'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorFirebase, setErrorFirebase] = useState(null);

  const [presupuestoMensual, setPresupuestoMensual] = useState(() => {
    return Number(localStorage.getItem('app_presupuesto_mensual')) || 450000;
  });

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [integranteFiltro, setIntegranteFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  // Formulario de Gastos
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Alimentación',
    integrante: 'Sergio',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'Mercado Pago'
  });

  // Cargar datos desde Firestore
  const cargarGastosDesdeFirebase = async () => {
    try {
      setCargando(true);
      setErrorFirebase(null);
      const datos = await getGastos();
      setGastos(datos);
    } catch (err) {
      console.error("Error al conectar con Firestore:", err);
      setErrorFirebase("No se pudo conectar a Firebase. Revisá las credenciales en src/firebase/config.js o las reglas de Firestore.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGastosDesdeFirebase();
  }, []);

  useEffect(() => {
    localStorage.setItem('app_presupuesto_mensual', presupuestoMensual.toString());
  }, [presupuestoMensual]);

  // Guardar nuevo gasto
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descripcion || !form.monto || Number(form.monto) <= 0) return;

    try {
      await addGasto(form);
      setForm({
        descripcion: '',
        monto: '',
        categoria: 'Alimentación',
        integrante: 'Sergio',
        fecha: new Date().toISOString().split('T')[0],
        metodoPago: 'Mercado Pago'
      });
      await cargarGastosDesdeFirebase();
    } catch (err) {
      console.error("Error al agregar gasto:", err);
      alert("Error al guardar en Firebase. Verificá la conexión.");
    }
  };

  // Eliminar gasto
  const handleDelete = async (id) => {
    try {
      await deleteGasto(id);
      await cargarGastosDesdeFirebase();
    } catch (err) {
      console.error("Error al eliminar gasto:", err);
      alert("No se pudo eliminar el gasto de Firebase.");
    }
  };

  // Filtrado de lista
  const gastosFiltrados = useMemo(() => {
    return gastos.filter(g => {
      const matchCat = categoriaFiltro === 'Todas' || g.categoria === categoriaFiltro;
      const matchInt = integranteFiltro === 'Todos' || g.integrante === integranteFiltro;
      const matchSearch = g.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchInt && matchSearch;
    });
  }, [gastos, categoriaFiltro, integranteFiltro, busqueda]);

  // Cálculos y totales
  const totalGastado = useMemo(() => {
    return gastosFiltrados.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);
  }, [gastosFiltrados]);

  const chartDataCategoria = useMemo(() => {
    const counts = {};
    gastosFiltrados.forEach(g => {
      const cat = g.categoria || 'Varios';
      counts[cat] = (counts[cat] || 0) + Number(g.monto || 0);
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat]
    }));
  }, [gastosFiltrados]);

  const porcentajePresupuesto = Math.min(Math.round((totalGastado / presupuestoMensual) * 100), 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="text-blue-600" />
              Gestión de Gastos Familiares
            </h1>
            <p className="text-slate-500 text-sm mt-1">Conectado a Firebase Firestore en tiempo real</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Firebase Activo
          </div>
        </header>

        {/* Alerta de Error si falla Firebase */}
        {errorFirebase && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p>{errorFirebase}</p>
          </div>
        )}

        {/* Tarjetas de Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gastado</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              ${totalGastado.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-slate-500 mt-2">Total según filtros aplicados</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presupuesto Mensual</span>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-bold text-slate-800">${presupuestoMensual.toLocaleString('es-AR')}</div>
              <input 
                type="number" 
                value={presupuestoMensual}
                onChange={(e) => setPresupuestoMensual(Number(e.target.value))}
                className="w-24 text-xs p-1.5 border rounded-lg text-right"
                placeholder="Límite"
              />
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full ${porcentajePresupuesto > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
                style={{ width: `${porcentajePresupuesto}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{porcentajePresupuesto}% del presupuesto utilizado</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría Mayoritaria</span>
            {chartDataCategoria.length > 0 ? (
              <div>
                <div className="text-2xl font-bold text-slate-800">
                  {chartDataCategoria.sort((a,b) => b.value - a.value)[0]?.name}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ${chartDataCategoria.sort((a,b) => b.value - a.value)[0]?.value.toLocaleString('es-AR')} acumulados
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin datos registrados</p>
            )}
          </div>
        </div>

        {/* Sección Central: Formulario y Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Alta */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="text-blue-600 w-5 h-5" /> Registrar Nuevo Gasto
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Descripción</label>
                <input 
                  type="text"
                  placeholder="ej. Supermercado, Luz, Nafta"
                  value={form.descripcion}
                  onChange={e => setForm({...form, descripcion: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Monto ($)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={e => setForm({...form, monto: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoría</label>
                  <select 
                    value={form.categoria}
                    onChange={e => setForm({...form, categoria: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Integrante</label>
                  <select 
                    value={form.integrante}
                    onChange={e => setForm({...form, integrante: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {INTEGRANTES.map(int => <option key={int} value={int}>{int}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Fecha</label>
                  <input 
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm({...form, fecha: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Método de Pago</label>
                  <select 
                    value={form.metodoPago}
                    onChange={e => setForm({...form, metodoPago: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm hover:shadow"
              >
                Guardar en Firebase
              </button>
            </form>
          </div>

          {/* Gráfico de Desglose por Categoría */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col justify-between">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <PieChartIcon className="text-blue-600 w-5 h-5" /> Distribución por Categoría
            </h2>

            {chartDataCategoria.length > 0 ? (
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartDataCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `$${val.toLocaleString('es-AR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Cargá un gasto para visualizar el gráfico.
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {chartDataCategoria.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  {entry.name}: <span className="font-semibold">${entry.value.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filtros y Tabla de Gastos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <h2 className="text-lg font-bold text-slate-800">Histórico de Gastos</h2>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <select 
                value={categoriaFiltro}
                onChange={e => setCategoriaFiltro(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="Todas">Todas las Categorías</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                value={integranteFiltro}
                onChange={e => setIntegranteFiltro(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl text-xs bg-white"
              >
                <option value="Todos">Todos los Integrantes</option>
                {INTEGRANTES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="overflow-x-auto">
            {cargando ? (
              <div className="text-center py-8 text-slate-400 text-sm">Cargando gastos desde Firebase...</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Integrante</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Monto</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gastosFiltrados.length > 0 ? (
                    gastosFiltrados.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{g.fecha}</td>
                        <td className="p-3 font-medium text-slate-800">{g.descripcion}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                            {g.categoria}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-600">{g.integrante}</td>
                        <td className="p-3 text-xs text-slate-400">{g.metodoPago}</td>
                        <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          ${Number(g.monto)?.toLocaleString('es-AR')}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleDelete(g.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar Gasto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center p-6 text-slate-400 text-sm">
                        No hay gastos guardados o no coinciden con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}