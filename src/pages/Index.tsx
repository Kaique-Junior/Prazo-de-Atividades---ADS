"use client";

import { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface Atividade {
  titulo: string;
  disciplina: string;
  dataEntrega: string;
}

interface AtividadeComDias extends Atividade {
  diasRestantes: number;
  status: "URGENTE" | "IMPORTANTE" | "TRANQUILO";
}

const Index = () => {
  const [atividades, setAtividades] = useState<AtividadeComDias[]>([]);
  const [dataAtual, setDataAtual] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6-29uYKdWPh1KcQn6SM36wU5a44JpxTW7BXwJxO9HSYhDHxEq1QDtRdXdOEGbOz55AVznV_bjGAMF/pub?gid=404939283&single=true&output=csv");
        
        if (!response.ok) {
          throw new Error("Erro ao buscar dados da planilha");
        }
        
        const csvText = await response.text();
        const linhas = csvText.split('\n').filter(linha => linha.trim());
        
        // Pular cabeçalho e processar dados
        const atividadesData: Atividade[] = [];
        
        for (let i = 1; i < linhas.length; i++) {
          const colunas = linhas[i].split(',');
          if (colunas.length >= 3) {
            atividadesData.push({
              titulo: colunas[0]?.trim() || '',
              disciplina: colunas[1]?.trim() || '',
              dataEntrega: colunas[2]?.trim() || ''
            });
          }
        }

        // Função para converter data DD/MM/AAAA para objeto Date
        const parseDate = (dateString: string): Date => {
          const [dia, mes, ano] = dateString.split('/');
          return new Date(`${ano}-${mes}-${dia}`);
        };

        // Calcular dias restantes e categorizar
        const atividadesComDias = atividadesData.map(atividade => {
          const dataEntrega = parseDate(atividade.dataEntrega);
          const hoje = new Date();
          const diffTime = dataEntrega.getTime() - hoje.getTime();
          const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let status: "URGENTE" | "IMPORTANTE" | "TRANQUILO" = "TRANQUILO";
          if (diasRestantes <= 2) {
            status = "URGENTE";
          } else if (diasRestantes <= 5) {
            status = "IMPORTANTE";
          }

          return {
            ...atividade,
            diasRestantes,
            status
          };
        });

        setAtividades(atividadesComDias);
        setError("");
      } catch (err) {
        console.error("Erro ao buscar atividades:", err);
        setError("Não foi possível carregar as atividades. Verifique a conexão e tente novamente.");
        setAtividades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAtividades();
    
    // Formatar data atual
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    setDataAtual(dataFormatada);
  }, []);

  // Agrupar atividades por status
  const atividadesAgrupadas = {
    URGENTES: atividades.filter(a => a.status === "URGENTE"),
    IMPORTANTES: atividades.filter(a => a.status === "IMPORTANTE"),
    TRANQUILOS: atividades.filter(a => a.status === "TRANQUILO")
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "URGENTE": return "bg-red-500";
      case "IMPORTANTE": return "bg-yellow-500";
      case "TRANQUILO": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "URGENTE": return "URGENTES";
      case "IMPORTANTE": return "IMPORTANTES";
      case "TRANQUILO": return "TRANQUILOS";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Erro ao carregar</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📌 PAINEL DE PRAZOS</h1>
          <p className="text-gray-400">Atualizado em: {dataAtual}</p>
        </div>

        {/* Seção URGENTES */}
        {atividadesAgrupadas.URGENTES.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full ${getStatusColor("URGENTE")} mr-3`}></div>
              <h2 className="text-xl font-semibold text-white">URGENTES</h2>
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {atividadesAgrupadas.URGENTES.length}
              </span>
            </div>
            <div className="space-y-4">
              {atividadesAgrupadas.URGENTES.map((atividade, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800 rounded-lg p-4 border-l-4 border-red-500 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📘</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{atividade.titulo}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <div className="flex items-center text-gray-300">
                          <span className="mr-1">📚</span>
                          <span>{atividade.disciplina}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <span className="mr-1">📅</span>
                          <span>{atividade.dataEntrega}</span>
                        </div>
                        <div className="flex items-center text-red-400 font-medium">
                          <span className="mr-1">⏳</span>
                          <span>{atividade.diasRestantes} dias restantes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção IMPORTANTES */}
        {atividadesAgrupadas.IMPORTANTES.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full ${getStatusColor("IMPORTANTE")} mr-3`}></div>
              <h2 className="text-xl font-semibold text-white">IMPORTANTES</h2>
              <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                {atividadesAgrupadas.IMPORTANTES.length}
              </span>
            </div>
            <div className="space-y-4">
              {atividadesAgrupadas.IMPORTANTES.map((atividade, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-500 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📘</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{atividade.titulo}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <div className="flex items-center text-gray-300">
                          <span className="mr-1">📚</span>
                          <span>{atividade.disciplina}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <span className="mr-1">📅</span>
                          <span>{atividade.dataEntrega}</span>
                        </div>
                        <div className="flex items-center text-yellow-400 font-medium">
                          <span className="mr-1">⏳</span>
                          <span>{atividade.diasRestantes} dias restantes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção TRANQUILOS */}
        {atividadesAgrupadas.TRANQUILOS.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`w-4 h-4 rounded-full ${getStatusColor("TRANQUILO")} mr-3`}></div>
              <h2 className="text-xl font-semibold text-white">TRANQUILOS</h2>
              <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {atividadesAgrupadas.TRANQUILOS.length}
              </span>
            </div>
            <div className="space-y-4">
              {atividadesAgrupadas.TRANQUILOS.map((atividade, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800 rounded-lg p-4 border-l-4 border-green-500 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📘</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{atividade.titulo}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <div className="flex items-center text-gray-300">
                          <span className="mr-1">📚</span>
                          <span>{atividade.disciplina}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <span className="mr-1">📅</span>
                          <span>{atividade.dataEntrega}</span>
                        </div>
                        <div className="flex items-center text-green-400 font-medium">
                          <span className="mr-1">⏳</span>
                          <span>{atividade.diasRestantes} dias restantes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há atividades */}
        {atividades.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-semibold text-white mb-2">Nenhuma atividade encontrada</h2>
            <p className="text-gray-400">Verifique a planilha Google Sheets ou adicione atividades para começar!</p>
          </div>
        )}

        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;