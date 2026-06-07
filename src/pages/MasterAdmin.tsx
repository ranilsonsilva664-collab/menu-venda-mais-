import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Trash2, Shield, Search, ExternalLink, LogOut, Store } from "lucide-react";

// Master password configuration
const MASTER_PASSWORD = "master123";

interface Restaurant {
  id: string; // The slug
  name: string;
  whatsappNumber: string;
  createdAt?: string; // If we start saving this later
}

export default function MasterAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  // Check local storage for session on mount
  useEffect(() => {
    const session = localStorage.getItem("master_admin_session");
    if (session === MASTER_PASSWORD) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      localStorage.setItem("master_admin_session", password);
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("master_admin_session");
    setIsAuthenticated(false);
    setPassword("");
  };

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "restaurants"));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
      setRestaurants(data);
    } catch (error) {
      console.error("Erro ao carregar restaurantes:", error);
      alert("Erro ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadRestaurants();
    }
  }, [isAuthenticated]);

  const handleDelete = async (restaurantId: string, restaurantName: string) => {
    const confirmDelete = window.confirm(
      `ATENÇÃO: Você tem certeza que deseja excluir o restaurante "${restaurantName}"?\n\nEsta ação é irreversível e excluirá todos os produtos também.`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      // 1. First, delete all items in the 'menu' subcollection
      const menuSnapshot = await getDocs(collection(db, "restaurants", restaurantId, "menu"));
      const deletePromises = menuSnapshot.docs.map(itemDoc => 
        deleteDoc(doc(db, "restaurants", restaurantId, "menu", itemDoc.id))
      );
      await Promise.all(deletePromises);

      // 2. Then delete the main restaurant document
      await deleteDoc(doc(db, "restaurants", restaurantId));

      alert("Restaurante excluído com sucesso!");
      // Reload the list
      loadRestaurants();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir o restaurante.");
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name?.toLowerCase().includes(query.toLowerCase()) || 
    r.id.toLowerCase().includes(query.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-zinc-200">
          <div className="size-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6 mx-auto">
            <Shield className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Painel do Dono</h1>
          <p className="text-zinc-500 text-sm text-center mb-6">Acesso restrito. Insira a senha mestre para continuar.</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-zinc-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-4"
            placeholder="Senha Mestre"
            autoFocus
          />
          <button
            type="submit"
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition"
          >
            Entrar no Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Painel Master</h1>
              <p className="text-sm text-zinc-500">Gerenciamento de Lojas Cadastradas</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar loja..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 focus:border-zinc-400 outline-none text-sm"
              />
            </div>
            <button
              onClick={handleLogout}
              className="h-10 px-4 flex items-center gap-2 text-zinc-600 hover:bg-zinc-100 rounded-xl text-sm font-medium transition shrink-0"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </header>

        <main className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <h2 className="font-semibold flex items-center gap-2">
              <Store className="size-4 text-zinc-500" /> 
              Total de Lojas: {restaurants.length}
            </h2>
            <button 
              onClick={loadRestaurants}
              disabled={loading}
              className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
            >
              {loading ? "Atualizando..." : "Atualizar Lista"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-medium border-b border-zinc-200">Nome do Negócio</th>
                  <th className="px-6 py-4 font-medium border-b border-zinc-200">Link (Slug)</th>
                  <th className="px-6 py-4 font-medium border-b border-zinc-200">WhatsApp</th>
                  <th className="px-6 py-4 font-medium border-b border-zinc-200 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading && restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">Carregando lojas...</td>
                  </tr>
                ) : filteredRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">Nenhuma loja encontrada.</td>
                  </tr>
                ) : (
                  filteredRestaurants.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50 transition">
                      <td className="px-6 py-4 font-medium">{r.name || "Sem Nome"}</td>
                      <td className="px-6 py-4 text-zinc-500">
                        <a href={`/${r.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline flex items-center gap-1">
                          /{r.id} <ExternalLink className="size-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{r.whatsappNumber || "Não definido"}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" /> Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
