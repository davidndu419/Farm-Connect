import { createBrowserRouter } from "react-router-dom";
import { GuestRoute } from "../components/auth/GuestRoute.jsx";
import { ProtectedRoute } from "../components/auth/ProtectedRoute.jsx";
import { RoleRoute } from "../components/auth/RoleRoute.jsx";
import { RouteFallback } from "../components/common/RouteFallback.jsx";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { AuthLayout } from "../layouts/AuthLayout.jsx";
import { SessionAwareLayout } from "../layouts/SessionAwareLayout.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";
import { SplashPage } from "../pages/SplashPage.jsx";

function lazyPage(importer, exportName) {
  return async () => {
    const module = await importer();
    return { Component: module[exportName] };
  };
}

export const router = createBrowserRouter([
  { path: "/", element: <SplashPage /> },
  {
    element: <SessionAwareLayout />,
    HydrateFallback: RouteFallback,
    children: [
      {
        path: "/marketplace",
        lazy: lazyPage(
          () => import("../pages/MarketplacePage.jsx"),
          "MarketplacePage"
        )
      },
      {
        path: "/products/:productId",
        lazy: lazyPage(
          () => import("../pages/ProductDetailsPage.jsx"),
          "ProductDetailsPage"
        )
      }
    ]
  },
  {
    path: "/farmers/:farmerId",
    HydrateFallback: RouteFallback,
    lazy: lazyPage(
      () => import("../pages/FarmerProfilePage.jsx"),
      "FarmerProfilePage"
    )
  },
  {
    element: <GuestRoute />,
    HydrateFallback: RouteFallback,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/login",
            lazy: lazyPage(() => import("../pages/LoginPage.jsx"), "LoginPage")
          },
          {
            path: "/register",
            lazy: lazyPage(
              () => import("../pages/RegisterPage.jsx"),
              "RegisterPage"
            )
          }
        ]
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    HydrateFallback: RouteFallback,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/profile",
            lazy: lazyPage(
              () => import("../pages/ProfilePage.jsx"),
              "ProfilePage"
            )
          },
          {
            path: "/messages",
            lazy: lazyPage(
              () => import("../pages/MessagesPage.jsx"),
              "MessagesPage"
            )
          },
          {
            path: "/messages/:conversationId",
            lazy: lazyPage(() => import("../pages/ChatPage.jsx"), "ChatPage")
          },
          {
            path: "/users/:userId",
            lazy: lazyPage(
              () => import("../pages/UserProfilePage.jsx"),
              "UserProfilePage"
            )
          },
          {
            element: <RoleRoute role="farmer" />,
            children: [
              {
                path: "/products/new",
                lazy: lazyPage(
                  () => import("../pages/AddProductPage.jsx"),
                  "AddProductPage"
                )
              },
              {
                path: "/products/:productId/edit",
                lazy: lazyPage(
                  () => import("../pages/EditProductPage.jsx"),
                  "EditProductPage"
                )
              },
              {
                path: "/my-products",
                lazy: lazyPage(
                  () => import("../pages/MyProductsPage.jsx"),
                  "MyProductsPage"
                )
              }
            ]
          }
        ]
      }
    ]
  },
  { path: "*", element: <NotFoundPage /> }
]);
