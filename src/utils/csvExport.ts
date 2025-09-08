import { format } from 'date-fns';
import type { User, Booking, Car } from '../types';

// Helper function to convert data to CSV format
const convertToCSV = (headers: string[], data: any[][]): string => {
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    row.map(cell => {
      // Handle cells that contain commas or quotes
      const cellStr = String(cell ?? '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// Helper function to trigger CSV download
const downloadCSV = (csvContent: string, filename: string) => {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export customer list
interface CustomerWithStats extends User {
  is_blacklisted?: boolean;
  total_bookings?: number;
  total_spent?: number;
  last_booking_date?: string;
}

export const exportCustomersCSV = (customers: CustomerWithStats[]) => {
  const headers = ['Name', 'Phone', 'Email', 'Total Bookings', 'Total Spent ($)', 'Last Booking', 'Status'];
  
  const data = customers.map(customer => [
    `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'No name',
    customer.phone || '',
    customer.email || '',
    customer.total_bookings || 0,
    (customer.total_spent || 0).toFixed(2),
    customer.last_booking_date ? format(new Date(customer.last_booking_date), 'MM/dd/yyyy') : 'Never',
    customer.is_blacklisted ? 'Blacklisted' : 'Active'
  ]);
  
  const csvContent = convertToCSV(headers, data);
  const filename = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

// Export monthly revenue report
interface BookingWithCar extends Booking {
  car?: Car;
  customer_name?: string;
  customer_email?: string;
}

export const exportMonthlyRevenueCSV = (bookings: BookingWithCar[], month: Date) => {
  const headers = ['Date', 'Customer', 'Car', 'Days', 'Daily Rate ($)', 'Total ($)', 'Status'];
  
  // Filter bookings for the selected month
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const monthlyBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.created_at);
    return bookingDate >= monthStart && bookingDate <= monthEnd && booking.status === 'confirmed';
  });
  
  const data = monthlyBookings.map(booking => {
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = booking.car?.daily_rate || 0;
    const total = booking.grand_total || booking.total_price || 0;
    
    return [
      format(startDate, 'MM/dd/yyyy'),
      booking.customer_name || 'Unknown',
      booking.car ? `${booking.car.make} ${booking.car.model}` : 'Unknown',
      days,
      dailyRate.toFixed(2),
      total.toFixed(2),
      'Completed'
    ];
  });
  
  // Add total row
  const totalRevenue = monthlyBookings.reduce((sum, b) => sum + (b.grand_total || b.total_price || 0), 0);
  data.push(['', '', 'TOTAL', '', '', totalRevenue.toFixed(2), '']);
  
  const csvContent = convertToCSV(headers, data);
  const filename = `revenue_${format(month, 'yyyy-MM')}.csv`;
  downloadCSV(csvContent, filename);
};

// Export car performance report
interface CarWithStats extends Car {
  total_bookings?: number;
  total_revenue?: number;
  total_days?: number;
}

export const exportCarPerformanceCSV = (cars: Car[], bookings: Booking[]) => {
  const headers = ['Car', 'License Plate', 'Total Days Rented', 'Occupancy Rate (%)', 'Total Revenue ($)', 'Avg Daily Revenue ($)'];
  
  // Calculate stats for each car
  const carStats = cars.map(car => {
    const carBookings = bookings.filter(b => b.car_id === car.id && b.status === 'confirmed');
    
    const totalDays = carBookings.reduce((sum, booking) => {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);
    
    const totalRevenue = carBookings.reduce((sum, b) => sum + (b.grand_total || b.total_price || 0), 0);
    
    // Assume we're looking at the last 90 days for occupancy calculation
    const daysInPeriod = 90;
    const occupancyRate = (totalDays / daysInPeriod * 100).toFixed(1);
    const avgDailyRevenue = totalDays > 0 ? (totalRevenue / totalDays).toFixed(2) : '0.00';
    
    return [
      `${car.make} ${car.model}`,
      car.license_plate || 'N/A',
      totalDays,
      occupancyRate,
      totalRevenue.toFixed(2),
      avgDailyRevenue
    ];
  });
  
  // Sort by total revenue descending
  carStats.sort((a, b) => parseFloat(b[4] as string) - parseFloat(a[4] as string));
  
  const csvContent = convertToCSV(headers, carStats);
  const filename = `car_performance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};