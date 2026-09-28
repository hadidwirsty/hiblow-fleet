import { create } from "zustand"

import type { ThemeStore } from "@/types"

export const useUIStore = create<ThemeStore>((set) => ({
  isSidebarOpen: false,
  loading: false,
  modalDelete: {
    open: false,
    title: "",
    message: "",
    type: "",
    action: () => {},
  },
  modalInactive: {
    open: false,
    title: "",
    message: "",
    actionMessage: "Nonaktifkan",
    type: "",
    action: () => {},
  },
  modalSuccess: {
    open: false,
    title: "",
    message: "",
    actionMessage: "Tutup",
    actionVariant: "outline",
    animation: "success",
    action: () => {},
  },
  setLoading: (loading) => {
    set({ loading })
  },
  setModalDelete: (modal) => {
    set((state) => ({
      modalDelete: {
        ...state.modalDelete,
        ...modal,
      },
    }))
  },
  setModalInactive: (modal) => {
    set((state) => ({
      modalInactive: {
        ...state.modalInactive,
        ...modal,
      },
    }))
  },
  setModalSuccess: (modal) => {
    set((state) => ({
      modalSuccess: {
        ...state.modalSuccess,
        ...modal,
      },
    }))
  },
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
  },
}))

export const useTheme = useUIStore
export default useUIStore
