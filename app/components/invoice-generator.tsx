'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, InfoIcon, DollarSign } from 'lucide-react'
import { format, addDays, differenceInWeeks } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { jsPDF } from "jspdf"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import confetti from 'canvas-confetti'

type HoursType = 'perWeek' | 'total'

interface HeroPillProps {
  label: string
  announcement?: string
  className?: string
}

function HeroPill({ 
  label, 
  announcement = "📣 Announcement",
  className,
}: HeroPillProps) {
  return (
    <motion.div
      className={cn(
        "flex w-auto items-center space-x-2 rounded-full",
        "ring-1 ring-accent",
        "px-2 py-1 whitespace-pre",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className={cn(
        "w-fit rounded-full bg-accent px-2 py-0.5",
        "text-xs font-medium text-primary sm:text-sm",
        "text-center"
      )}>
        {announcement}
      </div>
      <p className="text-xs font-medium text-primary sm:text-sm">
        {label}
      </p>
    </motion.div>
  )
}

export default function InvoiceGenerator() {
  const [hourlyRate, setHourlyRate] = useState<number>(0)
  const [hours, setHours] = useState<number>(0)
  const [hoursType, setHoursType] = useState<HoursType>('perWeek')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [dueDate, setDueDate] = useState<Date>()
  const [totalAmount, setTotalAmount] = useState<number>(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)
  const [clientName, setClientName] = useState<string>('')
  const [businessName, setBusinessName] = useState<string>('')
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [description, setDescription] = useState<string>('')
  const [displayAmount, setDisplayAmount] = useState(totalAmount);
  const prevAmountRef = useRef(totalAmount);

  useEffect(() => {
    if (hourlyRate && hours) {
      let calculatedTotal: number;
      if (hoursType === 'perWeek') {
        const weeks = startDate && endDate ? differenceInWeeks(endDate, startDate) + 1 : 1;
        calculatedTotal = hourlyRate * hours * weeks;
      } else {
        calculatedTotal = hourlyRate * hours;
      }
      setTotalAmount(calculatedTotal);
    } else {
      setTotalAmount(0);
    }
  }, [hourlyRate, hours, hoursType, startDate, endDate])

  useEffect(() => {
    if (totalAmount !== prevAmountRef.current) {
      const start = prevAmountRef.current;
      const end = totalAmount;
      const duration = 1000; // Animation duration in milliseconds
      const startTime = performance.now();

      const animateValue = (timestamp: number) => {
        const progress = (timestamp - startTime) / duration;
        if (progress < 1) {
          const currentValue = start + (end - start) * progress;
          setDisplayAmount(currentValue);
          requestAnimationFrame(animateValue);
        } else {
          setDisplayAmount(end);
        }
      };

      requestAnimationFrame(animateValue);
      prevAmountRef.current = totalAmount;
    }
  }, [totalAmount]);

  const generateInvoiceNumber = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  const handleConfetti = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      );
    }, 250);
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const invoiceNumber = generateInvoiceNumber()
    const issueDate = new Date()
    
    // Set font styles
    doc.setFont("helvetica")
    
    // INVOICE text
    doc.setFontSize(36)
    doc.setFont("helvetica", "bold")
    doc.text('INVOICE', 20, 40)
    
    // From section
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text('From', 140, 30)
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(businessName, 170, 30)
    
    // Invoice details - left side
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text('Invoice ID', 20, 80)
    doc.text('Issue date', 20, 95)
    doc.text('Due date', 20, 110)
    
    // Invoice details - values
    doc.setFont("helvetica", "bold")
    doc.text(invoiceNumber, 80, 80)
    doc.text(format(issueDate, 'MM/dd/yyyy'), 80, 95)
    doc.text(dueDate ? format(dueDate, 'MM/dd/yyyy') : format(issueDate, 'MM/dd/yyyy') + ' (upon receipt)', 80, 110)
    
    // Invoice for section
    doc.setFont("helvetica", "normal")
    doc.text('Invoice for', 140, 80)
    doc.setFont("helvetica", "bold")
    doc.text(clientName, 170, 80)
    
    // Date Range and Weeks
    if (startDate && endDate) {
      const weeks = differenceInWeeks(endDate, startDate) + 1
      doc.setFont("helvetica", "normal")
      doc.text('Date Range', 20, 125)
      doc.setFont("helvetica", "bold")
      doc.text(`${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')} (${weeks} week${weeks > 1 ? 's' : ''})`, 80, 125)
    }

    // Table headers
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    const headers = ['Item type', 'Description', 'Quantity', 'Unit price', 'Amount']
    const columnPositions = [20, 80, 140, 160, 180]
    
    const tableStartY = startDate && endDate ? 150 : 135

    // Add header line
    doc.setDrawColor(200, 200, 200)
    doc.line(20, tableStartY, 190, tableStartY)
    
    // Add headers
    headers.forEach((header, index) => {
      doc.text(header, columnPositions[index], tableStartY - 5)
    })
    
    // Table content
    doc.setFont("helvetica", "normal")
    const serviceDescription = description || (startDate && endDate 
      ? `${format(startDate, 'MM/dd/yyyy')} - ${format(endDate, 'MM/dd/yyyy')}`
      : '')
    
    const totalHours = hoursType === 'perWeek' && startDate && endDate
      ? hours * (differenceInWeeks(endDate, startDate) + 1)
      : hours;

    // Table rows
    doc.text('Service', columnPositions[0], tableStartY + 15)
    doc.text(serviceDescription, columnPositions[1], tableStartY + 15)
    doc.text(totalHours.toString(), columnPositions[2], tableStartY + 15)
    doc.text(`$${hourlyRate.toFixed(2)}`, columnPositions[3], tableStartY + 15)
    doc.text(`$${totalAmount.toFixed(2)}`, columnPositions[4], tableStartY + 15)
    
    // Add bottom line
    doc.line(20, tableStartY + 25, 190, tableStartY + 25)
    
    // Amount due section
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text('Amount due', 140, tableStartY + 45)
    doc.text(`$${totalAmount.toFixed(2)}`, 180, tableStartY + 45)
    
    doc.save('invoice.pdf')
    setShowAnnouncement(true)
    setIsPreviewOpen(false)
    handleConfetti()
    setTimeout(() => setShowAnnouncement(false), 6000)
  }

  const previewInvoice = () => {
    setIsPreviewOpen(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      {showAnnouncement && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <HeroPill
            label="You just made some serious cash! 💰"
            announcement="Nice!"
            className="bg-green-100 dark:bg-green-900 ring-green-500 text-green-800 dark:text-green-100"
          />
        </div>
      )}
      <div className="w-full max-w-2xl mx-auto">
        <div className="md:bg-card md:text-card-foreground md:rounded-xl md:shadow-lg md:border md:border-border/50 md:backdrop-blur-sm transition-all">
          <div className="p-4 md:p-8 space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Invoice Generator</h1>
              <p className="text-muted-foreground">Create professional invoices in seconds</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">Client Information</h2>
                  <p className="text-sm text-muted-foreground">Enter your client's details</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client name"
                      className="transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">Business Information</h2>
                  <p className="text-sm text-muted-foreground">Enter your business details</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1">
                    <Label htmlFor="businessName">Business Name</Label>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>You can also add your full legal name if you are freelancing independently.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your business name"
                    className="transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Invoice Details</h2>
                <p className="text-sm text-muted-foreground">Enter the payment and time information</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Enter description (eg. web development, contract design, marketing)"
                    className="transition-all"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={hourlyRate || ''}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    placeholder="Enter hourly rate"
                    className="transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <Button
                      variant="outline"
                      onClick={() => setHoursType('perWeek')}
                      className={`w-full transition-all ${
                        hoursType === 'perWeek'
                          ? 'border-2 border-black bg-gray-100 hover:bg-gray-100 dark:border-primary dark:bg-[#2A2A2A] dark:hover:bg-[#2A2A2A]'
                          : 'border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      Hours/week
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setHoursType('total')}
                      className={`w-full transition-all ${
                        hoursType === 'total'
                          ? 'border-2 border-black bg-gray-100 hover:bg-gray-100 dark:border-primary dark:bg-[#2A2A2A] dark:hover:bg-[#2A2A2A]'
                          : 'border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      Total Hours
                    </Button>
                  </div>
                  <Input
                    id="hours"
                    type="number"
                    value={hours || ''}
                    onChange={(e) => setHours(Number(e.target.value))}
                    placeholder={hoursType === 'perWeek' ? "Enter hours worked per week" : "Enter total hours worked"}
                    className="transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date Range (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal transition-all">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate && endDate
                          ? `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`
                          : "Pick a date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{ from: startDate, to: endDate }}
                        onSelect={(range) => {
                          setStartDate(range?.from)
                          setEndDate(range?.to)
                        }}
                        numberOfMonths={2}
                        initialFocus
                        className="rounded-md border"
                        classNames={{
                          day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal transition-all">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate
                          ? format(dueDate, "PPP")
                          : "Pick a due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        className="rounded-md border"
                        classNames={{
                          day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Total Amount:</h2>
                <div className="text-3xl font-bold flex items-center">
                  ${displayAmount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).slice(1)} {/* slice(1) removes the currency symbol as we're already displaying $ */}
                </div>
              </div>
              <Button 
                onClick={previewInvoice} 
                className="w-full bg-black hover:bg-gray-800 text-white dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground transition-colors"
              >
                Preview Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Client Information</h3>
              <p className="text-muted-foreground">{clientName || 'Not specified'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Business Information</h3>
              <p className="text-muted-foreground">{businessName || 'Not specified'}</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Invoice Details</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span>{description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span>${hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{hoursType === 'perWeek' ? 'Hours/week' : 'Total Hours'}:</span>
                  <span>{hours}</span>
                </div>
                {startDate && endDate ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span>{format(startDate, "PPP")} - {format(endDate, "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weeks:</span>
                      <span>{differenceInWeeks(endDate, startDate) + 1}</span>
                    </div>
                  </>
                ) : hoursType === 'perWeek' ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weeks:</span>
                    <span>1 (default)</span>
                  </div>
                ) : null}
                {dueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{format(dueDate, "PPP")}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t text-base font-semibold">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={generatePDF} 
              className="w-full bg-[#4cd964] hover:bg-[#4cd964]/90 text-white transition-all rounded-md flex items-center justify-center gap-2 shadow-lg hover:shadow-[#4cd964]/25 hover:shadow-xl"
            >
              <DollarSign className="h-4 w-4" />
              Create Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

