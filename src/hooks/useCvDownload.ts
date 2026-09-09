import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/useSession";
import {
  createCvPayment,
  getCvAccess,
  getCvPrice,
} from "@/lib/payments.functions";

type PaymentMethod = "mpesa" | "emola" | "mkesh" | "card";
type MobilePaymentMethod = Exclude<PaymentMethod, "card">;

/**
 * Deteta automaticamente o método de pagamento pelo prefixo
 * do número de telemóvel moçambicano.
 */
function detectMobilePaymentMethod(
  raw: string,
): MobilePaymentMethod | null {
  let n = (raw || "").replace(/\D/g, "");

  if (n.startsWith("00")) {
    n = n.slice(2);
  }

  if (n.startsWith("258")) {
    n = n.slice(3);
  }

  if (n.startsWith("84") || n.startsWith("85")) {
    return "mpesa";
  }

  if (n.startsWith("86") || n.startsWith("87")) {
    return "emola";
  }

  if (n.startsWith("82") || n.startsWith("83")) {
    return "mkesh";
  }

  return null;
}

/**
 * Controla o download do CV.
 *
 * O PDF só fica disponível depois do pagamento confirmado.
 * Para M-Pesa, e-Mola e mKesh, o método é detetado
 * automaticamente pelo prefixo do número.
 */
export function useCvDownload() {
  const { user } = useSession();

  const access = useServerFn(getCvAccess);
  const price = useServerFn(getCvPrice);
  const pay = useServerFn(createCvPayment);

  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    void price().then((r) => {
      if (active) {
        setAmount(r.price);
      }
    });

    if (user) {
      void access().then((r) => {
        if (active) {
          setPaid(r.paid);
        }
      });
    } else {
      setPaid(false);
    }

    return () => {
      active = false;
    };
  }, [user, access, price]);

  const download = useCallback(
    async (
      phone?: string,
      method?: PaymentMethod,
    ) => {
      if (paid) {
        window.print();
        return;
      }

      if (!user) {
        setMessage(
          "Inicie sessão para pagar e descarregar o seu CV.",
        );
        return;
      }

      const normalizedPhone = (phone ?? "").trim();

      /*
       * Se o método for cartão, não precisamos de telefone.
       * Para pagamentos móveis, o telefone é obrigatório.
       */
      if (method === "card") {
        setBusy(true);
        setMessage("");

        try {
          const result = await pay({
            data: {
              returnUrl: window.location.href,
              method: "card",
            },
          });

          if (result.ok) {
            setMessage("A processar o pagamento...");

            for (let i = 0; i < 30; i++) {
              await new Promise((r) => setTimeout(r, 4000));

              const check = await access();

              if (check.paid) {
                setPaid(true);
                setMessage(
                  "Pagamento confirmado. A preparar o download...",
                );

                setTimeout(() => window.print(), 600);
                return;
              }
            }

            setMessage(
              "Ainda não recebemos a confirmação. Se já concluiu o pagamento, toque em verificar pagamento.",
            );
          } else {
            setMessage(result.error);
          }
        } catch (error) {
          console.error(
            "Erro ao iniciar pagamento do CV:",
            error,
          );

          setMessage(
            "Não foi possível iniciar o pagamento. Tente novamente.",
          );
        } finally {
          setBusy(false);
        }

        return;
      }

      if (!normalizedPhone) {
        setMessage(
          "Introduza o número de telemóvel para continuar com o pagamento.",
        );
        return;
      }

      /*
       * Se o método não foi informado, detetamos pelo prefixo.
       */
      const selectedMethod =
        method ?? detectMobilePaymentMethod(normalizedPhone);

      if (!selectedMethod) {
        setMessage(
          "Número não compatível. Use M-Pesa (84/85), e-Mola (86/87) ou mKesh (82/83).",
        );
        return;
      }

      setBusy(true);
      setMessage("");

      try {
        const result = await pay({
          data: {
            returnUrl: window.location.href,
            method: selectedMethod,
            msisdn: normalizedPhone,
          },
        });

        if (result.ok) {
          setMessage(
            selectedMethod === "mpesa"
              ? "Confirme o pagamento M-Pesa no seu telemóvel introduzindo o PIN."
              : selectedMethod === "emola"
                ? "Confirme o pagamento e-Mola no seu telemóvel introduzindo o PIN."
                : "Confirme o pagamento mKesh no seu telemóvel introduzindo o PIN.",
          );

          // Aguarda a confirmação sem sair do site.
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 4000));

            const check = await access();

            if (check.paid) {
              setPaid(true);
              setMessage(
                "Pagamento confirmado. A preparar o download...",
              );

              setTimeout(() => window.print(), 600);
              return;
            }
          }

          setMessage(
            "Ainda não recebemos a confirmação. Se já introduziu o PIN, toque em verificar pagamento.",
          );
        } else {
          setMessage(result.error);
        }
      } catch (error) {
        console.error(
          "Erro ao iniciar pagamento do CV:",
          error,
        );

        setMessage(
          "Não foi possível iniciar o pagamento. Tente novamente.",
        );
      } finally {
        setBusy(false);
      }
    },
    [paid, user, pay, access],
  );

  const recheck = useCallback(async () => {
    if (!user) {
      setMessage("Inicie sessão para verificar o pagamento.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const r = await access();

      setPaid(r.paid);

      if (!r.paid) {
        setMessage(
          "Ainda não recebemos a confirmação do pagamento. Tente daqui a instantes.",
        );
      }
    } catch {
      setMessage(
        "Não foi possível verificar o pagamento.",
      );
    } finally {
      setBusy(false);
    }
  }, [user, access]);

  return {
    paid,
    amount,
    busy,
    message,
    download,
    recheck,
  };
    }
