// 🔔 TOAST MESSAGE
function showToast(msg){
    let toast = document.createElement("div");
    toast.innerText = msg;

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "#0f172a";
    toast.style.color = "white";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 0 15px rgba(0,255,255,0.3)";
    toast.style.zIndex = "999";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 🔐 ADMIN LOGIN
function login(){
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    if(user === "admin" && pass === "1234"){
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("loader").style.display = "flex";

        setTimeout(() => {
            document.getElementById("loader").style.display = "none";
            document.getElementById("mainContent").style.display = "block";
            showToast("✅ Admin Login Successful");
        }, 1000);

    } else {
        showToast("❌ Wrong Admin Credentials");
    }
}

// 👤 EMPLOYEE LOGIN
function employeeLogin(){

    let id = document.getElementById("empId").value;
    let pass = document.getElementById("empPass").value;

    if(id === "tanu" && pass === "1234"){
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("loader").style.display = "flex";

        setTimeout(() => {
            document.getElementById("loader").style.display = "none";
            document.getElementById("mainContent").style.display = "block";

            document.getElementById("status").innerText = "👤 Employee Mode";
            document.querySelectorAll(".view").forEach(btn => btn.style.display = "none");

            showToast("👤 Employee Login Successful");
        }, 1000);

    } else {
        showToast("❌ Invalid Employee Credentials");
    }
}

// 🎥 START CAMERA
function startSystem() {
    document.getElementById("status").innerText = "📸 Starting Camera...";

    fetch("http://127.0.0.1:5000/start")
        .then(res => res.text())
        .then(data => {
            document.getElementById("status").innerText = "✅ " + data;
            showToast("Camera Started");
        })
        .catch(() => {
            document.getElementById("status").innerText = "⚠ Backend not running";
            showToast("⚠ Backend not running");
        });

    startCameraUI();
}

// 📊 VIEW ATTENDANCE
function viewAttendance() {

    let viewButtons = document.querySelectorAll(".view");
    if (viewButtons[0].style.display === "none") {
        showToast("❌ Access Denied");
        return;
    }

    fetch("http://127.0.0.1:5000/attendance")
        .then(res => res.json())
        .then(data => {

            data = data.filter(row => row[0] && row[0] !== "-");

            if (data.length === 0) {
                document.getElementById("attendanceBox").innerHTML =
                    "<p>No attendance yet</p>";
                return;
            }

            let unique = {};
            data.forEach(row => {
                unique[row[0]] = row;
            });

            data = Object.values(unique).reverse();

            document.getElementById("total").innerText = data.length;

            let todayDate = new Date().toLocaleDateString("en-GB");
            let todayCount = data.filter(row => row[1] === todayDate).length;
            document.getElementById("today").innerText = todayCount;

            let html = `
                <h3>📊 Attendance Records</h3>
                <input type="text" id="searchBox" placeholder="🔍 Search name..." onkeyup="searchAttendance()" />
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Entry</th>
                        <th>Exit</th>
                    </tr>
            `;

            data.forEach((row, index) => {
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${row[0]}</td>
                        <td>${row[1]}</td>
                        <td>${row[2]}</td>
                        <td>${row[3] === "-" ? "<span style='color:red;'>Not exited</span>" : row[3]}</td>
                    </tr>
                `;
            });

            html += "</table>";

            // 🔥 FIXED BUTTON WRAPPER
            
            document.getElementById("attendanceBox").innerHTML = html;
            document.getElementById("attendanceContainer").style.display = "block";

            showChart(data);
            showToast("Attendance Loaded");
        });
}

// 📊 MODERN CHART
function showChart(data){

    let counts = {};

    data.forEach(row => {
        let name = row[0];
        counts[name] = (counts[name] || 0) + 1;
    });

    let labels = Object.keys(counts);
    let values = Object.values(counts);

    if(window.myChart){
        window.myChart.destroy();
    }

    let ctx = document.getElementById("attendanceChart").getContext("2d");

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attendance',
                data: values,
                backgroundColor: [
                    '#3b82f6',
                    '#22c55e',
                    '#f59e0b',
                    '#ef4444',
                    '#a855f7'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
}

// 🎥 CAMERA UI
function startCameraUI(){
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            document.getElementById("camera").srcObject = stream;
        });
}

// 📥 DOWNLOAD
function downloadCSV() {
    window.open("attendance.csv");
}

// ❌ CLOSE
function closeAttendance() {
    document.getElementById("attendanceContainer").style.display = "none";
}

// 🚪 EXIT
function exitApp() {
    let name = prompt("Enter your exact name:");
    if (!name) return;

    fetch(`http://127.0.0.1:5000/exit/${name}`)
        .then(res => res.text())
        .then(msg => {
            if (msg.includes("Invalid")) {
                showToast("❌ Invalid Name");
            } else {
                document.getElementById("status").innerText = `👋 ${name} exited`;
                showToast("Exit Recorded ✅");
            }
        })
        .catch(() => {
            showToast("❌ Error");
        });
}

// 🔙 LOGOUT
function goBack() {
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("loginBox").style.display = "flex";

    document.getElementById("status").innerText = "🟢 System Ready";

    document.querySelectorAll(".view").forEach(btn => btn.style.display = "inline-block");

    showToast("Logged Out");
}

// 🔄 PAGE LOAD
window.onload = function () {
    document.getElementById("mainContent").style.display = "none";
};
function showPercentage() {

    fetch("http://127.0.0.1:5000/attendance")
        .then(res => res.json())
        .then(data => {

            let totalDaysSet = new Set();
            let studentData = {};

            data.forEach(row => {
                let name = row[0];
                let date = row[1];

                totalDaysSet.add(date);

                if (!studentData[name]) {
                    studentData[name] = new Set();
                }

                studentData[name].add(date);
            });

            let totalDays = totalDaysSet.size;

            let html = `<h3>📊 Attendance Percentage</h3>
                        <div class="percent-wrapper">`;

            for (let name in studentData) {

                let present = studentData[name].size;
                let percent = Math.round((present / totalDays) * 100);

                html += `
                    <div class="percent-card">
                        <div class="circle">
                            <span>${percent}%</span>
                        </div>
                        <p>${name}</p>
                        <small>${present} / ${totalDays} Days</small>
                    </div>
                `;
            }

            html += `</div>`;

            document.getElementById("attendanceBox").innerHTML = html;
            document.getElementById("attendanceContainer").style.display = "block";

            showToast("Percentage Loaded");
        });
}
async function downloadData() {
    try {
        // CSV fetch karo
        const response = await fetch("attendance.csv");
        const data = await response.text();

        // 👇 Optional: console me dekh sakti ho
        console.log("CSV Data:\n", data);

        // Format check (example line)
        // aastha,13/04/2026,7:08 PM,-

        // Blob bana ke download
        const blob = new Blob([data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "attendance.csv";
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Download error:", error);
        alert("File load nahi ho rahi ⚠️");
    }
}
