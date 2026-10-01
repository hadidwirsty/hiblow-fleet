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
import alertAnimation from "@/public/animations/alert.json"
import successAnimation from "@/public/animations/success.json"

export default function ModalSuccess() {
  const { modalSuccess, setModalSuccess } = useUIStore()

  const handleAction = async () => {
    try {
      if (modalSuccess.action) {
        await modalSuccess.action()
      }
    } catch (error) {
      console.error("Gagal menjalankan aksi modal sukses:", error)
    } finally {
      setModalSuccess({
        open: false,
        title: "",
        message: "",
        actionMessage: "Tutup",
        actionVariant: "outline",
        animation: "success",
        action: () => {},
      })
    }
  }

  const renderAnimation = () => {
    if (modalSuccess.animation === "alert") {
      return alertAnimation
    }
    return successAnimation
  }

  return (
    <Dialog
      open={modalSuccess.open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleAction()
      }}
    >
      <DialogContent className="flex flex-col items-center justify-between sm:max-w-md lg:max-w-md">
        <LottiePlayer
          autoplay
          loop
          animationData={renderAnimation()}
          style={{ height: "150px", width: "150px" }}
        />

        <DialogHeader>
          <DialogTitle className="text-center sm:text-lg">
            {modalSuccess.title || "Berhasil"}
          </DialogTitle>
          <DialogDescription className="text-center sm:text-sm">
            {modalSuccess.message}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 w-full">
          <Button
            type="button"
            onClick={handleAction}
            variant={modalSuccess.actionVariant || "outline"}
            className="h-10 w-full font-medium transition-all duration-200"
          >
            {modalSuccess.actionMessage || "Tutup"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
