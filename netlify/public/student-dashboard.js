import { getCurrentUser } from './auth.js';
import { getToken, removeToken } from './token-service.js';

let subjectsAndPrices = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  // Update personal information
  updatePersonalInfo(user);

  // تحميل معلومات المواد والأسعار
  subjectsAndPrices = await loadSubjectsAndPrices();

  // تحميل المواد والجداول الزمنية
  loadSubjectsAndSchedules(user);

  // Load subscription data
  loadSubscriptionData();

  // Set up logout button
  setupLogout();
});

function updatePersonalInfo(profile) {
  // Update profile image
  const profileImage = document.getElementById('profileImage');
  if (profile.picture) {
    profileImage.src = profile.picture;
  }

  // Update name and email
  document.getElementById('fullName').textContent = profile.name || 'غير محدد';
  document.getElementById('email').textContent = profile.email || 'غير محدد';
}

async function loadSubjectsAndPrices() {
  try {
    const response = await fetch('/pricing.json');
    if (!response.ok) {
      throw new Error('فشل في تحميل المواد والأسعار');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('خطأ في تحميل المواد والأسعار:', error);
  }
}

function loadSubjectsAndSchedules(user) {
  // مثال على البيانات الموجودة في قاعدة البيانات
  const sampleData = [
    {
      name: 'quran',
      department: 'memorization',
      teacher: 'الشيخ أحمد',
      platform: 'zoom',
      sessionsPerMonth: 8,
      remainingSessions: 5,
      schedule: [
        {
          day: 'الاثنين',
          dayCode: 'mon',
          time: '8:00 صباحاً',
          status: 'upcoming/finished',
          meetingLink: 'https://meet.google.com/abc'
        },
        {
          day: 'الخميس',
          dayCode: 'thu',
          time: '10:00 صباحاً',
          status: 'upcoming/finished',
          meetingLink: 'https://meet.google.com/abc'
        }
      ]
    }
  ];

  const subjectsContainer = document.getElementById('subjects-container');
  subjectsContainer.innerHTML = '';

  sampleData.forEach(subject => {
    const name = subject.name.toLowerCase();
    const department = subject.department.toLowerCase();
    const subjectElement = document.createElement('div');
    subjectElement.className = 'subject-item';
    const subjectHeader = document.createElement('h3');
    subjectHeader.textContent = `${subjectsAndPrices.subjects[name].name} - ${subjectsAndPrices.subjects[name].departments[department].name}`;
    subjectElement.appendChild(subjectHeader);

    const teacherElement = document.createElement('p');
    teacherElement.textContent = `المعلم: ${subject.teacher}`;
    subjectElement.appendChild(teacherElement);
    const platformElement = document.createElement('p');
    platformElement.textContent = `المنصة: ${subject.platform}`;
    subjectElement.appendChild(platformElement);
    const sessionsElement = document.createElement('p');
    sessionsElement.textContent = `عدد الجلسات في الشهر: ${subject.sessionsPerMonth}`;
    subjectElement.appendChild(sessionsElement);
    const remainingSessionsElement = document.createElement('p');
    remainingSessionsElement.textContent = `الجلسات المتبقية: ${subject.remainingSessions}`;
    subjectElement.appendChild(remainingSessionsElement);

    const scheduleHeader = document.createElement('h4');
    scheduleHeader.textContent = 'الجدول الزمني';
    subjectElement.appendChild(scheduleHeader);

    const scheduleTable = document.createElement('table');
    scheduleTable.innerHTML = `
      <thead>
        <tr>
          <th>اليوم</th>
          <th>الوقت</th>
          <th>الحالة</th>
          <th>رابط الاجتماع</th>
        </tr>
      </thead>
      <tbody>
        ${subject.schedule.map(lesson => `
          <tr class="${lesson.status === 'قادم' ? 'table-primary' : ''}">
            <td>${lesson.day}</td>
            <td>${lesson.time}</td>
            <td>
              <span class="badge ${lesson.status === 'upcoming' ? 'bg-primary' : 'bg-secondary'}">
                ${lesson.status}
              </span>
            </td>
            <td>
              ${lesson.status === 'upcoming' ?
        `<a href="${lesson.meetingLink}" class="btn btn-sm btn-success" target="_blank"> <i class="bi bi-camera-video"></i> انضم للحصة</a>` :
        'غير متاح-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;
    subjectElement.appendChild(scheduleTable);
    subjectsContainer.appendChild(subjectElement);
  });
}

function loadSubscriptionData() {
  // Sample subscription data - replace with actual API call
  const subscription = {
    packageType: 'الباقة الشهرية',
    startDate: '2025-06-01',
    endDate: '2025-07-01',
    status: 'نشط'
  };

  document.getElementById('packageType').textContent = subscription.packageType;
  document.getElementById('startDate').textContent = new Date(subscription.startDate).toLocaleDateString('ar-SA');
  document.getElementById('endDate').textContent = new Date(subscription.endDate).toLocaleDateString('ar-SA');

  const statusElement = document.getElementById('subscriptionStatus');
  statusElement.textContent = subscription.status;
  statusElement.className = `badge ${subscription.status === 'نشط' ? 'bg-success' : 'bg-danger'}`;
}

function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      const token = getToken();
      await fetch('/.netlify/functions/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      removeToken();
      window.location.href = '/login.html';
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  });
};
