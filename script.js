// =========================================================================
// ACADEMIC CGPA CALCULATOR & TARGET DEGREE PLANNER (5.0 SCALE SYSTEM)
// =========================================================================

const GRADES = { A: 5.0, B: 4.0, C: 3.0, D: 2.0, E: 1.0, F: 0.0 };
const SEMESTERS = ['Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2'];
const getSemName = k => `Year ${k[1]} - Semester ${k[3]}`;

const SAMPLE_COURSES = [
    { id: '101', semester: 'Y1S1', code: 'CSC 101', units: 3, grade: 'A' },
    { id: '102', semester: 'Y1S1', code: 'MTH 101', units: 4, grade: 'B' },
    { id: '103', semester: 'Y1S1', code: 'PHY 101', units: 3, grade: 'A' },
    { id: '104', semester: 'Y1S1', code: 'GST 101', units: 2, grade: 'A' },
    { id: '201', semester: 'Y1S2', code: 'CSC 102', units: 3, grade: 'A' },
    { id: '202', semester: 'Y1S2', code: 'MTH 102', units: 4, grade: 'B' },
    { id: '203', semester: 'Y1S2', code: 'GST 102', units: 2, grade: 'C' }
];

let courses = [];
const $ = id => document.getElementById(id);

// Storage Management
const loadCourses = () => {
    try {
        const stored = localStorage.getItem('academic_courses_v2');
        courses = stored ? JSON.parse(stored) : [...SAMPLE_COURSES];
    } catch {
        courses = [...SAMPLE_COURSES];
    }
};
const saveCourses = () => localStorage.setItem('academic_courses_v2', JSON.stringify(courses));

// Metrics & Calculations
function calcMetrics(list = courses) {
    const units = list.reduce((sum, c) => sum + c.units, 0);
    const pts = list.reduce((sum, c) => sum + c.units * (GRADES[c.grade] ?? 0), 0);
    return { units, pts, cgpa: units ? pts / units : 0, count: list.length };
}

function getDegreeClass(cgpa) {
    if (cgpa >= 4.5) return { title: 'First Class Honours 🏆', badge: 'bg-success' };
    if (cgpa >= 3.5) return { title: 'Second Class Upper (2:1) 🥈', badge: 'bg-primary' };
    if (cgpa >= 2.4) return { title: 'Second Class Lower (2:2) 🥉', badge: 'bg-info' };
    if (cgpa >= 1.5) return { title: 'Third Class Honours 🎖️', badge: 'bg-warning text-dark' };
    if (cgpa >= 1.0) return { title: 'Pass 📄', badge: 'bg-secondary' };
    if (cgpa > 0)   return { title: 'Fail / At Risk ⚠️', badge: 'bg-danger' };
    return { title: 'No Data', badge: 'bg-light text-dark' };
}

// Render UI
function renderApp() {
    const m = calcMetrics();
    $('cgpaValue').textContent = m.cgpa.toFixed(2);
    $('totalUnitsValue').textContent = m.units;
    $('totalCoursesValue').textContent = m.count;
    $('totalPointsValue').textContent = m.pts.toFixed(1);

    const deg = getDegreeClass(m.cgpa);
    $('degreeClassBadge').innerHTML = `<span class="badge ${deg.badge} fs-6 fw-normal">${deg.title}</span>`;
    renderSemesters();
}

function renderSemesters() {
    const search = $('searchCourse').value.trim().toLowerCase();
    const container = $('semestersContainer');
    container.innerHTML = '';
    let renderedCount = 0;

    SEMESTERS.forEach(sem => {
        const list = courses.filter(c => c.semester === sem && (!search || c.code.toLowerCase().includes(search)));
        if (!list.length && search) return;
        renderedCount++;

        const m = calcMetrics(list);
        const card = document.createElement('div');
        card.className = 'card border mb-3 shadow-sm';
        card.innerHTML = `
            <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0 text-dark">
                    <i class="bi bi-calendar3 text-primary me-2"></i>${getSemName(sem)}
                </h6>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary-subtle text-primary fw-semibold">GPA: ${m.cgpa.toFixed(2)}</span>
                    <span class="badge bg-secondary-subtle text-secondary small">${m.units} Credits</span>
                </div>
            </div>
            <div class="card-body p-0">
                ${!list.length ? `
                    <div class="p-3 text-center text-muted small">No courses added for this semester yet.</div>
                ` : `
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0 semester-table">
                            <thead>
                                <tr class="small text-muted">
                                    <th>Course Code</th>
                                    <th class="text-center">Credit Units</th>
                                    <th class="text-center">Grade</th>
                                    <th class="text-center">Grade Points</th>
                                    <th class="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody class="small">
                                ${list.map(c => `
                                    <tr>
                                        <td class="fw-semibold text-dark">${c.code}</td>
                                        <td class="text-center">${c.units}</td>
                                        <td class="text-center">
                                            <span class="badge badge-grade-${c.grade} px-2 py-1">${c.grade} (${GRADES[c.grade]} pts)</span>
                                        </td>
                                        <td class="text-center fw-bold">${(c.units * GRADES[c.grade]).toFixed(1)}</td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteCourse('${c.id}')" title="Delete Course">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
        container.appendChild(card);
    });

    if (!renderedCount) {
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="bi bi-search fs-1 mb-2 d-block"></i>
                <p>No matching courses found for "${search}".</p>
            </div>
        `;
    }
}

// Event Handlers
function handleAddCourse(e) {
    e.preventDefault();
    const code = $('courseCode').value.trim().toUpperCase();
    const units = parseInt($('creditUnits').value, 10);

    if (!code || isNaN(units) || units < 1) return alert('Please enter a valid course code and credit units.');

    courses.push({
        id: Date.now().toString(),
        semester: $('semesterSelect').value,
        code,
        units,
        grade: $('gradeSelect').value
    });

    saveCourses();
    renderApp();
    $('courseCode').value = '';
    $('creditUnits').value = '';
    $('courseCode').focus();
}

function deleteCourse(id) {
    if (confirm('Are you sure you want to delete this course result?')) {
        courses = courses.filter(c => c.id !== id);
        saveCourses();
        renderApp();
    }
}

function handleTargetPrediction(e) {
    e.preventDefault();
    const targetCgpa = parseFloat($('targetCgpaInput').value);
    const remUnits = parseInt($('remainingUnitsInput').value, 10);

    if (isNaN(targetCgpa) || targetCgpa < 1 || targetCgpa > 5 || isNaN(remUnits) || remUnits < 1) {
        return alert('Please enter a valid target CGPA (1.00 - 5.00) and remaining credit units.');
    }

    const { units, pts } = calcMetrics();
    const reqGPA = (targetCgpa * (units + remUnits) - pts) / remUnits;
    const alertEl = $('predictionAlert');

    $('predictionResult').classList.remove('d-none');

    if (reqGPA > 5.0) {
        alertEl.className = 'alert alert-danger border-0 shadow-sm';
        $('predictionTitle').innerHTML = `⚠️ Target Not Achievable Mathematically`;
        $('predictionBody').innerHTML = `To reach a CGPA of <strong>${targetCgpa.toFixed(2)}</strong>, you would need an average GPA of <strong>${reqGPA.toFixed(2)}</strong> in your remaining ${remUnits} credit units (Max possible GPA is 5.00).<br><em>Tip: Try setting a slightly lower target CGPA.</em>`;
    } else if (reqGPA <= 0) {
        alertEl.className = 'alert alert-success border-0 shadow-sm';
        $('predictionTitle').innerHTML = `🎉 Target Already Achieved!`;
        $('predictionBody').innerHTML = `Your current points are already sufficient! Maintain an average GPA of <strong>1.00+</strong> in your remaining ${remUnits} credit units to secure your target CGPA of <strong>${targetCgpa.toFixed(2)}</strong>.`;
    } else {
        alertEl.className = reqGPA >= 4.5 ? 'alert alert-warning border-0 shadow-sm' : 'alert alert-success border-0 shadow-sm';
        $('predictionTitle').innerHTML = `🎯 Target Advisor Analysis`;
        const advice = reqGPA >= 4.5 ? "This requires consistent <strong>First Class performance (mostly A's)</strong> in all remaining courses."
                     : reqGPA >= 3.5 ? "This is highly achievable! Aim for a mix of <strong>A's and B's</strong> in your remaining semesters."
                     : "Very achievable! Maintain steady performance across remaining credit units.";
        $('predictionBody').innerHTML = `You need an average GPA of <strong class="fs-5">${reqGPA.toFixed(2)}</strong> in your remaining <strong>${remUnits}</strong> credit units to graduate with a CGPA of <strong>${targetCgpa.toFixed(2)}</strong>.<br><span class="mt-2 d-block small">${advice}</span>`;
    }
}

function handleClearData() {
    if (confirm('Are you sure you want to reset all academic data? This will clear all entered courses.')) {
        courses = [];
        saveCourses();
        renderApp();
        $('predictionResult').classList.add('d-none');
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    renderApp();
    $('addCourseForm').addEventListener('submit', handleAddCourse);
    $('targetPredictorForm').addEventListener('submit', handleTargetPrediction);
    $('searchCourse').addEventListener('input', renderSemesters);
    $('clearDataBtn').addEventListener('click', handleClearData);
});
