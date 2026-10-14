import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const coleccionGastos = collection(db, 'gastos');

export const getGastos = async () => {
  const q = query(coleccionGastos, orderBy('fecha', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addGasto = async (nuevoGasto) => {
  return await addDoc(coleccionGastos, {
    ...nuevoGasto,
    monto: Number(nuevoGasto.monto)
  });
};

export const deleteGasto = async (id) => {
  const gastoRef = doc(db, 'gastos', id);
  return await deleteDoc(gastoRef);
};