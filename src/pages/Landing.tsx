import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { INITIAL_MENU } from "./RestaurantMenu";

export default function Landing() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlug(value);
  };

  const createRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !whatsapp || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    setLoading(true);
    try {
      // 1. Criar o documento principal do restaurante
      const restRef = doc(db, "restaurants", slug);
      await setDoc(restRef, {
        name,
        whatsappNumber: whatsapp,
        adminPassword: password,
        heroTitle: `Bem-vindo(a) ao ${name}`,
        heroSubtitle: "Faça seu pedido de forma rápida e prática.",
        heroBadge: "Novo por aqui",
        heroImage: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1600"
      });

      // 2. Popular o cardápio com os dados de exemplo usando um Batch
      const batch = writeBatch(db);
      const menuRef = collection(restRef, "menu");
      
      for (const item of INITIAL_MENU) {
        const itemDoc = doc(menuRef, item.id);
        batch.set(itemDoc, item);
      }
      await batch.commit();

      // Redirecionar para o cardápio recém criado
      navigate(`/${slug}`);
    } catch (error: any) {
      console.error("Erro ao criar cardápio:", error);
      alert("Ocorreu um erro ao criar a loja: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-zinc-900 mb-4 text-center">Crie seu Menu Digital</h1>
      <p className="text-zinc-600 mb-8 text-center max-w-md">
        Seja bem-vindo à nossa plataforma! Cadastre seu negócio, comece com um menu digital de exemplo lindo e receba pedidos no WhatsApp.
      </p>
      
      <form onSubmit={createRestaurant} className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-amber-100">
        <h2 className="text-xl font-semibold mb-6">Cadastre sua loja</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nome do seu negócio</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text" 
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" 
              placeholder="Ex: Hamburgueria do Zé" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Link Desejado</label>
            <div className="flex items-center">
              <span className="h-10 px-3 bg-zinc-100 border border-zinc-200 border-r-0 rounded-l-lg flex items-center text-sm text-zinc-500">
                app.com/
              </span>
              <input 
                required
                value={slug}
                onChange={handleSlugChange}
                type="text" 
                className="flex-1 h-10 px-3 rounded-r-lg border border-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" 
                placeholder="hamburgueria-do-ze" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">WhatsApp para Pedidos</label>
            <input 
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              type="text" 
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition font-mono" 
              placeholder="Ex: 5511999999999" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Senha de Administração</label>
            <input 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password" 
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" 
              placeholder="Crie uma senha para editar seu menu digital" 
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? "Criando e populando menu..." : "Criar Meu Menu Digital"}
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-sm text-zinc-500">
        Quer ver um exemplo? Acesse <a href="/savore" className="text-amber-600 font-semibold hover:underline">/savore</a>
      </div>
    </div>
  );
}
