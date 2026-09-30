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
import inactiveAnimation from "@/public/animations/inactive.json"

export default function ModalInactive() {
  const { modalInactive, setModalInactive } = useUIStore()
  const [isPending, setIsPending] = React.useState(false)

  const handleClose = () => {
    if (isPending) return
    setModalInactive({
      open: false,
      title: "",
      message: "",
      actionMessage: "Nonaktifkan",
      type: "",
      action: () => {},
    })
  }

  const handleAction = async () => {
    if (modalInactive.action) {
      try {
        setIsPending(true)
        await modalInactive.action()
      } catch (error) {
        console.error("Gagal menjalankan aksi penonaktifan modal:", error)
      } finally {
        setIsPending(false)
        setModalInactive({
          open: false,
          title: "",
          message: "",
          actionMessage: "Nonaktifkan",
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
      open={modalInactive.open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose()
      }}
    >
      <DialogContent className="flex flex-col items-center justify-between sm:max-w-md lg:max-w-md">
        <LottiePlayer
          autoplay
          loop={false}
          animationData={inactiveAnimation}
          style={{ height: "120px", width: "200px" }}
        />

        <DialogHeader>
          <DialogTitle className="text-center sm:text-lg">
            {modalInactive.title || "Nonaktifkan Referensi Rute?"}
          </DialogTitle>
          <DialogDescription className="text-center sm:text-sm">
            {modalInactive.message ||
              "Apakah Anda yakin ingin menonaktifkan rute ini? Rute yang dinonaktifkan tidak dapat dipilih saat pencatatan ritase baru."}
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
            loadingText="Menonaktifkan"
          >
            {modalInactive.actionMessage || "Nonaktifkan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
