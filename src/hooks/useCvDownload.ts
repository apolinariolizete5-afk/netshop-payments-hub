import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useSession } from "@/hooks/useSession";
import {
  createCvPayment,
  getCvAccess,
  getCvPrice,
} from "@/lib/payments.functions";

type PaymentMethod = "mpesa" | "emola" | "mkesh" | "card";

/**
 * Controla o download do CV.
 *
 * O PDF só fica disponível depois do pagamento confirmado.
 * Para M-Pesa, e-Mola e mKesh, o número de telefone é enviado
 * para a NetShop.
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
      method: PaymentMethod = "mpesa",
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

      if (method !== "card" && !normalizedPhone) {
        setMessage(
          "Introduza o número de telemóvel para continuar com o pagamento.",
        );
        return;
      }

      setBusy(true);
      setMessage("");

      try {
        const result = await pay({
          data: {
            returnUrl: window.location.href,
            method,
            ...(method !== "card"
              ? { msisdn: normalizedPhone }
              : {}),
          },
        });

        if (result.ok) {
          if (result.checkoutUrl) {
            window.location.href = result.checkoutUrl;
          } else {
            setMessage(
              "Pagamento iniciado, mas a página de pagamento não foi encontrada.",
            );
          }
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
    [paid, user, pay],
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
        setMessage("Ainda não recebemos a confirmação do pagamento. Tente daqui a instantes.");
      }
    } catch {
      setMessage("Não foi possível verificar o pagamento.");
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
