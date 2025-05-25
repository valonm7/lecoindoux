// admin_logic.js
// Handles admin dashboard logic, including fetching orders and updating the dashboard chart with real data.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCx5tv97A5GBce-iOECUYs_3G_IIm9TKB0",
    authDomain: "lecoindoux-6fda5.firebaseapp.com",
    projectId: "lecoindoux-6fda5",
    storageBucket: "lecoindoux-6fda5.appspot.com",
    messagingSenderId: "945779817294",
    appId: "1:945779817294:web:aa4940fbeee23e69d8fc1f",
    measurementId: "G-ZNYERDRF1T"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let dashboardChart;

// Utility function to parse Firebase timestamps or date strings
function parseDate(dateInput) {
    if (!dateInput) return null;
    
    try {
        if (dateInput.toDate) {
            return dateInput.toDate();
        }
        if (dateInput.seconds) {
            return new Date(dateInput.seconds * 1000);
        }
        const date = new Date(dateInput);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.warn('Error parsing date:', error);
        return null;
    }
}

// Fetch orders from Firestore
async function fetchAllOrders() {
    try {
        console.log("Fetching orders from Firestore...");
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("Fetched orders:", orders);
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

// Fetch customers data
export async function fetchAllCustomers() {
    try {
        console.log("Fetching customers from Firestore...");
        const usersCol = collection(db, "users");
        const usersSnapshot = await getDocs(usersCol);
        const customers = [];

        usersSnapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            customers.push(data);
        });

        console.log("Fetched customers:", customers);
        return customers;
    } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
}

// Calculate monthly statistics
function aggregateOrdersByMonth(orders) {
    const ordersCount = Array(12).fill(0);
    const revenueSum = Array(12).fill(0);

    orders.forEach(order => {
        try {
            if (!order.createdAt) {
                console.warn('Order missing createdAt:', order.id);
                return;
            }

            const date = parseDate(order.createdAt);
            if (!date) {
                console.warn('Invalid date format for order:', order.id, order.createdAt);
                return;
            }

            const amount = parseFloat(order.totalAmount || 0);
            if (isNaN(amount)) {
                console.warn('Invalid amount for order:', order.id, order.totalAmount);
                return;
            }

            const month = date.getMonth();
            ordersCount[month]++;
            revenueSum[month] += amount;
        } catch (error) {
            console.error('Error processing order:', order.id, error);
        }
    });

    return { ordersCount, revenueSum };
}

// Function to format price
function formatPrice(price) {
    return parseFloat(price || 0).toFixed(2);
}

// Calculate statistics
function calculateStatistics(orders) {
    console.log("Calculating statistics from orders. Input orders array length:", orders.length); // Modified log

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
        const amount = parseFloat(order.totalAmount || 0);
        // Added check for NaN after parsing amount
        if (isNaN(amount)) {
             console.warn("Invalid totalAmount found for order:", order.id, order.totalAmount); // Log problematic amount
             return sum; // Don't add to sum if invalid
        }
        return sum + amount;
    }, 0);

     // Get unique customers - Added check for userId existing
    const uniqueCustomers = new Set(orders.map(order => order.userId).filter(userId => userId != null)).size; // Added filter for null/undefined userId

    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get current month's data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const thisMonthOrders = orders.filter(order => {
        if (!order.createdAt) {
            return false;
        }
        
        const orderDate = parseDate(order.createdAt);
        if (!orderDate) {
            return false;
        }

        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    // Calculate this month's revenue
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => {
         const amount = parseFloat(order.totalAmount || 0);
         if (isNaN(amount)) {
             // console.warn("Invalid totalAmount for this month order:", order.id, order.totalAmount); // Too noisy, removed
             return sum;
         }
         return sum + amount;
    }, 0);


    console.log("Statistics calculated:", {
        totalOrders,
        totalRevenue,
        uniqueCustomers,
        avgOrderValue,
        thisMonthOrders: thisMonthOrders.length,
        thisMonthRevenue
    });

    return {
        totalOrders,
        totalRevenue,
        uniqueCustomers,
        avgOrderValue,
        thisMonthOrders: thisMonthOrders.length,
        thisMonthRevenue
    };
}

// Update dashboard statistics display
function updateDashboardStats(orders) {
    const stats = calculateStatistics(orders);

    // Update the display elements with formatted numbers
    document.getElementById('totalOrders').textContent = ` ${stats.totalOrders}`;
    document.getElementById('totalRevenue').textContent = `ALL ${formatPrice(stats.totalRevenue)}`;
    document.getElementById('totalCustomers').textContent = ` ${stats.uniqueCustomers}`;
    document.getElementById('avgOrderValue').textContent = ` ALL ${formatPrice(stats.avgOrderValue)}`;

    // Calculate and update trends (e.g., percentage changes)
   
}

// Initialize Chart
function initializeChart(ordersCount, revenueSum) {
    const ctx = document.getElementById('ordersRevenueChart');
    if (!ctx) {
        console.error("Chart canvas not found!");
        return null;
    }
    
    console.log("Initializing chart with data:", { ordersCount, revenueSum });
    
    const chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'],
            datasets: [
                {
                    label: 'Porosi',
                    data: ordersCount,
                    borderColor: '#ff7c08',
                    backgroundColor: 'rgba(255,124,8,0.1)',
                    tension: 0.3,
                    yAxisID: 'y',
                },
                {
                    label: 'Të Ardhura (ALL)',
                    data: revenueSum,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40,167,69,0.1)',
                    tension: 0.3,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            stacked: false,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { 
                        display: true, 
                        text: 'Numri i Porosive',
                        font: {
                            size: 12
                        }
                    },
                    min: 0,
                    ticks: {
                         stepSize: 1
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { 
                        display: true, 
                        text: 'Të Ardhurat (ALL)',
                        font: {
                            size: 12
                        }
                    },
                    min: 0
                }
            }
        }
    });
    
    console.log("Chart initialized successfully");
    return chart;
}

// Populate orders table
function populateOrdersTable(orders) {
    console.log("Populating orders table with:", orders);
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) {
        console.warn("Orders table body not found.");
        return;
    }

    tableBody.innerHTML = orders.map(order => {
        const date = parseDate(order.createdAt);
        const dateStr = date instanceof Date ? date.toLocaleDateString('sq-AL') : 'N/A';
        const status = order.status || 'pending';

        return `
            <tr>
                <td>${order.id ? order.id.substring(0, 8) + '...' : 'N/A'}</td>
                <td>${order.customerName || order.userName || order.userId || 'N/A'}</td>
                <td>${dateStr}</td>
                <td>ALL ${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${status}">${getStatusInAlbanian(status)}</span></td>
                <td><button class="action-btn btn-view" onclick="viewOrderDetails('${order.id || ''}')">Shiko</button></td>
            </tr>
        `;
    }).join('');
}

// Populate customers table
function populateCustomersTable(customers) {
    console.log("Populating customers table with:", customers);
    const tableBody = document.getElementById('customersTableBody');
    if (!tableBody) {
        console.warn("Customers table body not found.");
        return;
    }

    tableBody.innerHTML = '';

    customers.forEach(customer => {
        const row = document.createElement('tr');

        let dateStr = 'N/A';
        if (customer.createdAt) {
            const date = parseDate(customer.createdAt);
            if (date) {
                dateStr = date.toLocaleDateString('sq-AL');
            } else {
                console.warn("Could not format date for customer:", customer.id, customer.createdAt);
                dateStr = 'Invalid Date';
            }
        }

        row.innerHTML = `
            <td>${customer.name || customer.displayName || 'N/A'}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${dateStr}</td>
        `;

        tableBody.appendChild(row);
    });
     console.log("Customers table populated."); // Added log
}

// Translate order status to Albanian
function getStatusInAlbanian(status) {
    const translations = {
        'pending': 'Në pritje',
        'processing': 'Duke u procesuar',
        'completed': 'Përfunduar',
        'cancelled': 'Anuluar',
        'delivered': 'Dorëzuar',
        'returned': 'Kthyer'
    };
    return translations[status] || status;
}

// View order details function (no change needed)
window.viewOrderDetails = function(orderId) {
    console.log('Viewing order details for:', orderId);
    // You can implement modal popup here to show order details
};

// Initialize dashboard
async function initializeDashboard() {
    try {
        console.log("Starting dashboard initialization...");

        // Fetch data
        const orders = await fetchAllOrders();
        const customers = await fetchAllCustomers();

        // Check if data was actually fetched
        if (orders.length === 0) {
            console.warn("No orders fetched. Dashboard will show zeros.");
        }
         if (customers.length === 0) {
            console.warn("No customers fetched. Customer table will be empty and customer count might be zero.");
        }

        // Update statistics
        updateDashboardStats(orders); // Still pass the potentially empty array

        // Update chart
        const { ordersCount, revenueSum } = aggregateOrdersByMonth(orders); // Still pass the potentially empty array

        // Initialize chart only once
        if (!dashboardChart) {
            dashboardChart = initializeChart(ordersCount, revenueSum);
        } else {
            // Update existing chart
            dashboardChart.data.datasets[0].data = ordersCount;
            dashboardChart.data.datasets[1].data = revenueSum;
            dashboardChart.update();
             console.log("Existing chart updated."); // Added log
        }

        // Populate tables
        populateOrdersTable(orders); // Still pass the potentially empty array
        populateCustomersTable(customers); // Still pass the potentially empty array

        console.log("Dashboard initialization finished.");

    } catch (error) {
        console.error("Critical error during dashboard initialization:", error);
    }
}

// Tab switching functionality (no change needed)
function initializeTabs() {
     console.log("Initializing tabs..."); // Added log
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding tab
            button.classList.add('active');
            const activeTab = document.getElementById(tabName + 'Tab');
            if (activeTab) {
                activeTab.classList.add('active');
                 console.log(`Switched to tab: ${tabName}`); // Added log
            } else {
                 console.warn(`Tab content element not found for tab: ${tabName}`); // Added warning
            }
        });
         // Trigger click on the first tab button to set the default active tab on load
        if (button.classList.contains('active')) {
             button.click();
        }
    });

     // If no tab button has 'active' class initially, click the first one
     if (!document.querySelector('.tab-button.active')) {
         const firstTabButton = document.querySelector('.tab-button');
         if (firstTabButton) {
             firstTabButton.click();
         }
     }
}

// Sign out functionality (no change needed)
async function dilNgaLlogaria() {
    try {
        console.log("Attempting sign out..."); // Added log
        await auth.signOut();
        console.log("Përdoruesi doli me sukses.");
        window.location.href = 'login.html';
    } catch (gabim) {
        console.error("Gabim gjatë daljes nga llogaria:", gabim);
        alert("Ndodhi një gabim gjatë daljes nga llogaria. Ju lutem provoni përsëri.");
    }
}

// Initialize everything when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', dilNgaLlogaria);
    }

    // Check authentication and initialize dashboard
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await initializeDashboard();
        } else {
            window.location.href = 'login.html';
        }
    });

    const ordersTabButton = document.getElementById('ordersTabButton');
    if (ordersTabButton) {
        ordersTabButton.addEventListener('click', async () => {
            console.log('Orders tab activated. Fetching orders...');
            const orders = await fetchAllOrders();
            populateOrdersTable(orders);
        });
    }

    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const tabName = button.getAttribute('data-tab');

            if (tabName === 'orders') {
                console.log('Orders tab activated. Fetching orders...');
                const orders = await fetchAllOrders();
                populateOrdersTable(orders);
            } else if (tabName === 'customers') {
                console.log('Clients tab activated. Fetching clients...');
                const customers = await fetchAllCustomers();
                populateCustomersTable(customers);
            }
        });
    });
});