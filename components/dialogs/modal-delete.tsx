"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LottiePlayer } from "@/components/ui/lottie-player"
import { useUIStore } from "@/stores/theme"
import warningAnimation from "@/public/animations/warning.json"

export default function ModalDelete() {
  const { modalDelete, setModalDelete } = useUIStore()
  const [isPending, setIsPending] = React.useState(false)

  const handleClose = () => {
    if (isPending) return
    setModalDelete({
      open: false,
      title: "",
      message: "",
      type: "",
      action: () => {},
    })
  }

  const handleAction = async () => {
    if (modalDelete.action) {
      try {
        setIsPending(true)
        await modalDelete.action()
      } catch (error) {
        console.error("Gagal menjalankan aksi penghapusan modal:", error)
      } finally {
        setIsPending(false)
        setModalDelete({
          open: false,
          title: "",
          message: "",
          type: "",
          action: () => {},
        })
      }
    } else {
      handleClose()
    }
  }

  return (
    <Dialog
      open={modalDelete.open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
    >
      <DialogContent className="flex flex-col items-center justify-between sm:max-w-md lg:max-w-md">
        <LottiePlayer
          autoplay
          loop={false}
          animationData={warningAnimation}
          style={{ height: "180px", width: "180px" }}
        />

        <DialogHeader>
          <DialogTitle className="text-center sm:text-lg">
            {modalDelete.title || "Konfirmasi Penghapusan"}
          </DialogTitle>
          <DialogDescription className="text-center sm:text-sm">
            {modalDelete.message ||
              "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={handleClose}
            className="h-10 w-full font-medium transition-all duration-200"
            variant="outline"
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleAction}
            className="h-10 w-full font-medium transition-all duration-200"
            variant="destructive"
            loading={isPending}
            loadingText="Menghapus"
          >
            Hapus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
