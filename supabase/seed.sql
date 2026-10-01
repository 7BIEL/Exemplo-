-- =========================================================
-- Lucas Almeida · Negócios Imobiliários — ETAPA 1
-- Dados de TESTE: os 6 imóveis fictícios que estavam em assets/js/data.js,
-- migrados sem alteração de conteúdo.
--
-- Rode DEPOIS de supabase/schema.sql (Supabase → SQL Editor → Run).
-- Pode ser executado de novo: atualiza os imóveis pelo slug e recria as fotos deles.
--
-- Mapeamento a partir do data.js:
--   id            → slug        (mantém as URLs imovel.html?id=... e os favoritos já salvos)
--   destaque      → destaque_rotulo ("Novo no site", "Exclusivo")
--   coords [a, b] → lat, lng
--   descricao []  → descricao (parágrafos separados por linha em branco)
--   condominio [] → itens_condominio
--   imagens []    → tabela imovel_fotos (URL completa do Unsplash)
-- Todos entram com destaque = true e destaque_ordem na ordem original,
-- para a home continuar mostrando os mesmos 6 imóveis de antes.
-- =========================================================

insert into public.imoveis (
  slug, codigo, titulo, tipo, finalidade, status,
  destaque, destaque_rotulo, destaque_ordem, publicado,
  preco, condominio_valor, iptu, cidade, bairro,
  quartos, suites, banheiros, vagas, area,
  lat, lng, resumo, descricao,
  caracteristicas, itens_condominio
) values
  ('casa-contemporanea-campinas', 'LA-101', 'Casa contemporânea', 'Casa', 'comprar', 'disponivel', true, 'Novo no site', 1, true, 1250000, null, null, 'Campinas', 'Parque Taquaral', 3, 1, 3, 2, 180, -22.8745, -47.0435, 'Linhas retas, pé-direito generoso e integração total com o jardim.', 'Projeto contemporâneo com fachada em concreto aparente e madeira, pensado para quem valoriza luz natural e ambientes integrados.

O living com pé-direito duplo se abre para a área gourmet e o jardim através de grandes esquadrias de correr. A cozinha é planejada, com ilha central e acabamentos em quartzo.

No pavimento superior, três dormitórios — sendo uma suíte com closet e varanda — completam uma casa pronta para o dia a dia de uma família.', '["Pé-direito duplo no living","Cozinha planejada com ilha","Área gourmet com churrasqueira","Suíte com closet e varanda","Jardim com paisagismo","Aquecimento solar","Esquadrias em alumínio"]'::jsonb, '[]'::jsonb),
  ('apartamento-moderno-cambui', 'LA-102', 'Apartamento moderno', 'Apartamento', 'comprar', 'disponivel', true, null, 2, true, 685000, null, null, 'Campinas', 'Cambuí', 2, 1, 2, 1, 78, -22.8935, -47.052, 'Planta eficiente em uma das regiões mais caminháveis da cidade.', 'Apartamento reformado em edifício recente no Cambuí, a poucos passos de cafés, restaurantes e serviços.

Sala integrada à varanda, cozinha americana com marcenaria sob medida e dois dormitórios, sendo uma suíte. Piso vinílico em toda a área social e iluminação em LED.

Uma opção equilibrada para quem busca praticidade — seja para morar ou para investir.', '["Varanda integrada","Cozinha americana","Marcenaria sob medida","Suíte","Piso vinílico","Andar alto"]'::jsonb, '["Portaria 24h","Academia","Salão de festas","Bicicletário","Elevadores"]'::jsonb),
  ('casa-condominio-valinhos', 'LA-103', 'Casa em condomínio', 'Casa', 'comprar', 'disponivel', true, 'Exclusivo', 3, true, 1890000, null, null, 'Valinhos', 'Condomínio residencial', 4, 4, 4, 3, 240, -22.97, -46.996, 'Quatro suítes, piscina e a tranquilidade de um condomínio fechado.', 'Residência térrea em condomínio fechado, com amplo terreno e lazer completo para a família.

Todas as quatro suítes têm boa ventilação e armários planejados. A área social se volta para a piscina aquecida e o espaço gourmet, criando um ambiente ideal para receber.

Condomínio com segurança, áreas verdes e fácil acesso às principais rodovias da região.', '["4 suítes","Piscina aquecida","Espaço gourmet","Lavabo","Escritório","Energia solar fotovoltaica","Casa térrea"]'::jsonb, '["Portaria com controle de acesso","Trilhas e áreas verdes","Quadra de tênis","Playground","Salão de festas"]'::jsonb),
  ('apartamento-sofisticado-taquaral', 'LA-104', 'Apartamento sofisticado', 'Apartamento', 'comprar', 'disponivel', true, null, 4, true, 920000, null, null, 'Campinas', 'Taquaral', 3, 1, 2, 2, 105, -22.871, -47.056, 'Vista aberta, varanda gourmet e acabamentos de alto padrão.', 'Apartamento em andar alto próximo à Lagoa do Taquaral, com vista desimpedida e sol da manhã.

Varanda gourmet envidraçada integrada à sala, três dormitórios e cozinha com eletros embutidos. Acabamentos em porcelanato e marcenaria clara em todos os ambientes.

Edifício com lazer completo e vagas demarcadas.', '["Varanda gourmet envidraçada","Vista livre","Sol da manhã","Porcelanato","Eletros embutidos","Depósito privativo"]'::jsonb, '["Piscina adulto e infantil","Academia equipada","Espaço gourmet","Brinquedoteca","Portaria 24h"]'::jsonb),
  ('terreno-residencial-vinhedo', 'LA-105', 'Terreno residencial', 'Terreno', 'comprar', 'disponivel', true, null, 5, true, 540000, null, null, 'Vinhedo', 'Loteamento residencial', 0, 0, 0, 0, 300, -23.03, -46.975, 'Lote plano e pronto para construir o projeto da sua casa.', 'Terreno plano de 300 m² em loteamento residencial consolidado, com infraestrutura completa.

Topografia favorável, orientação solar privilegiada e documentação regularizada — pronto para receber o seu projeto.', '["Terreno plano","Frente para o norte","Documentação regularizada","Rua asfaltada","Rede de água e esgoto"]'::jsonb, '[]'::jsonb),
  ('sala-comercial-centro', 'LA-106', 'Sala comercial', 'Comercial', 'comprar', 'disponivel', true, null, 6, true, 390000, null, null, 'Campinas', 'Centro', 0, 0, 1, 1, 52, -22.9056, -47.0608, 'Sala pronta para uso em edifício corporativo bem localizado.', 'Sala comercial em edifício corporativo no Centro, com recepção, controle de acesso e fácil acesso a transporte público.

Entregue com piso elevado, forro modular e ar-condicionado. Uma boa opção para consultórios, escritórios ou para renda.', '["Piso elevado","Ar-condicionado","Forro modular","Copa","Banheiro privativo"]'::jsonb, '["Recepção","Controle de acesso","Elevadores","Gerador"]'::jsonb)
on conflict (slug) do update set
  codigo = excluded.codigo, titulo = excluded.titulo, tipo = excluded.tipo,
  finalidade = excluded.finalidade, status = excluded.status,
  destaque = excluded.destaque, destaque_rotulo = excluded.destaque_rotulo,
  destaque_ordem = excluded.destaque_ordem, publicado = excluded.publicado,
  preco = excluded.preco, condominio_valor = excluded.condominio_valor, iptu = excluded.iptu,
  cidade = excluded.cidade, bairro = excluded.bairro,
  quartos = excluded.quartos, suites = excluded.suites, banheiros = excluded.banheiros,
  vagas = excluded.vagas, area = excluded.area, lat = excluded.lat, lng = excluded.lng,
  resumo = excluded.resumo, descricao = excluded.descricao,
  caracteristicas = excluded.caracteristicas, itens_condominio = excluded.itens_condominio;

-- Fotos: recria as fotos dos imóveis de teste
delete from public.imovel_fotos
where imovel_id in (select id from public.imoveis where slug in ('casa-contemporanea-campinas', 'apartamento-moderno-cambui', 'casa-condominio-valinhos', 'apartamento-sofisticado-taquaral', 'terreno-residencial-vinhedo', 'sala-comercial-centro'));

insert into public.imovel_fotos (imovel_id, caminho, ordem, legenda)
select i.id, f.caminho, f.ordem, f.legenda
from (values
  ('casa-contemporanea-campinas', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80', 1, 'Casa contemporânea — foto 1 (demonstrativa)'),
  ('casa-contemporanea-campinas', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80', 2, 'Casa contemporânea — foto 2 (demonstrativa)'),
  ('casa-contemporanea-campinas', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80', 3, 'Casa contemporânea — foto 3 (demonstrativa)'),
  ('casa-contemporanea-campinas', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80', 4, 'Casa contemporânea — foto 4 (demonstrativa)'),
  ('casa-contemporanea-campinas', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80', 5, 'Casa contemporânea — foto 5 (demonstrativa)'),
  ('apartamento-moderno-cambui', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80', 1, 'Apartamento moderno — foto 1 (demonstrativa)'),
  ('apartamento-moderno-cambui', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80', 2, 'Apartamento moderno — foto 2 (demonstrativa)'),
  ('apartamento-moderno-cambui', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80', 3, 'Apartamento moderno — foto 3 (demonstrativa)'),
  ('apartamento-moderno-cambui', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80', 4, 'Apartamento moderno — foto 4 (demonstrativa)'),
  ('apartamento-moderno-cambui', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80', 5, 'Apartamento moderno — foto 5 (demonstrativa)'),
  ('casa-condominio-valinhos', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80', 1, 'Casa em condomínio — foto 1 (demonstrativa)'),
  ('casa-condominio-valinhos', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80', 2, 'Casa em condomínio — foto 2 (demonstrativa)'),
  ('casa-condominio-valinhos', 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80', 3, 'Casa em condomínio — foto 3 (demonstrativa)'),
  ('casa-condominio-valinhos', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80', 4, 'Casa em condomínio — foto 4 (demonstrativa)'),
  ('casa-condominio-valinhos', 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80', 5, 'Casa em condomínio — foto 5 (demonstrativa)'),
  ('apartamento-sofisticado-taquaral', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80', 1, 'Apartamento sofisticado — foto 1 (demonstrativa)'),
  ('apartamento-sofisticado-taquaral', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80', 2, 'Apartamento sofisticado — foto 2 (demonstrativa)'),
  ('apartamento-sofisticado-taquaral', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80', 3, 'Apartamento sofisticado — foto 3 (demonstrativa)'),
  ('apartamento-sofisticado-taquaral', 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80', 4, 'Apartamento sofisticado — foto 4 (demonstrativa)'),
  ('apartamento-sofisticado-taquaral', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80', 5, 'Apartamento sofisticado — foto 5 (demonstrativa)'),
  ('terreno-residencial-vinhedo', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80', 1, 'Terreno residencial — foto 1 (demonstrativa)'),
  ('terreno-residencial-vinhedo', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80', 2, 'Terreno residencial — foto 2 (demonstrativa)'),
  ('terreno-residencial-vinhedo', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80', 3, 'Terreno residencial — foto 3 (demonstrativa)'),
  ('sala-comercial-centro', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80', 1, 'Sala comercial — foto 1 (demonstrativa)'),
  ('sala-comercial-centro', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80', 2, 'Sala comercial — foto 2 (demonstrativa)'),
  ('sala-comercial-centro', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80', 3, 'Sala comercial — foto 3 (demonstrativa)')
) as f(slug, caminho, ordem, legenda)
join public.imoveis i on i.slug = f.slug;
