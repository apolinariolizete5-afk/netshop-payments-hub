import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade e cookies | Moza Empregos" },
      {
        name: "description",
        content:
          "Como o Moza Empregos recolhe, usa e protege os dados dos candidatos, e como utilizamos cookies na aplicação.",
      },
      { property: "og:title", content: "Política de privacidade | Moza Empregos" },
      {
        property: "og:description",
        content: "Transparência sobre dados pessoais, candidaturas, pagamentos e cookies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-base font-extrabold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <AppShell>
      <article className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold">Política de privacidade e cookies</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: setembro de 2026. Esta política explica como tratamos os seus dados no
          Moza Empregos.
        </p>

        <Section title="Que dados recolhemos">
          <p>
            Dados de conta (nome, email, telefone), dados de perfil e de currículo que introduz, as
            vagas que guarda e as candidaturas que envia. Nos pagamentos guardamos apenas a
            referência da transação — nunca dados completos de cartão ou PIN.
          </p>
        </Section>

        <Section title="Para que usamos os dados">
          <p>
            Para lhe mostrar vagas relevantes, enviar as suas candidaturas às empresas, gerar o seu
            CV e confirmar pagamentos. Não vendemos os seus dados a terceiros.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Usamos cookies e armazenamento local essenciais para manter a sessão iniciada, guardar o
            rascunho do seu CV e lembrar as suas preferências. Pode recusar cookies não essenciais no
            banner apresentado na primeira visita e limpar tudo nas definições do navegador.
          </p>
        </Section>

        <Section title="Partilha com empresas">
          <p>
            Ao enviar uma candidatura, os dados do formulário e o seu CV são partilhados com a
            empresa responsável pela vaga, para efeitos de recrutamento.
          </p>
        </Section>

        <Section title="Os seus direitos">
          <p>
            Pode aceder, corrigir ou eliminar os seus dados a qualquer momento no seu perfil, ou
            solicitando a eliminação da conta através do email de suporte.
          </p>
        </Section>

        <Section title="Contacto">
          <p>Para qualquer questão sobre privacidade, contacte-nos por email.</p>
        </Section>
      </article>
    </AppShell>
  );
}
