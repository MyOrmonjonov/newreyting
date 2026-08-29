import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Sahifadan sahifaga tez o'tishda har safar tarmoqdan qayta yuklamaslik uchun —
        // ma'lumot shu vaqt ichida "yangi" hisoblanadi, mutatsiyalar invalidateQueries bilan
        // baribir darhol majburiy yangilaydi.
        staleTime: 30_000,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Link ustiga sichqoncha kelganda (yoki tegilganda) sahifa kodi va so'rovlarini oldindan
    // boshlab qo'yadi — bosilgan payt tayyor turadi, "sekin almashish" hissi kamayadi.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 10_000,
  });

  return router;
};
