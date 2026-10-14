(() => {
  const notices = [
  {
    "tag": "tp",
    "category": "제품공지",
    "title": "5월 출시 제품",
    "body": "5월에 출시되는 신제품 목록에는 나노코트 V3 50ml와 왁스부스터 50ml가 포함되어 있습니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "5월 도시락 담당",
    "body": "5월 도시락 담당자는 철완, 다영, 해연이다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "4월 도시락 담당",
    "body": "4월 도시락 담당자는 준유, 혜선, 수빈입니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "슬리퍼 관련 공지사항",
    "body": "안전사고 예방을 위해 슬리퍼 착용에 대한 규정이 있습니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "6월 도시락 담당",
    "body": "6월 도시락 담당자는 상덕, 나겸, 현지로 지정되었습니다.",
    "author": "관리자"
  },
  {
    "tag": "ti",
    "category": "사내공지",
    "title": "3월 도시락 담당",
    "body": "3월 도시락 담당자는 김과장님, 선우, 리암입니다.",
    "author": "관리자"
  },
  {
    "tag": "tg",
    "category": "일반공지",
    "title": "산업안전보건교육",
    "body": "신입사원들을 위한 산업안전보건교육이 2026년 3월 31일 화요일 7시 55분에 진행됩니다.",
    "author": "관리자"
  }
];
  document.querySelectorAll('[data-notice-list]').forEach(list => {
    notices.forEach(notice => {
      const article = document.createElement('article');
      article.className = 'home-notice-row';
      const tag = document.createElement('span');
      tag.className = 'tag ' + notice.tag;
      tag.textContent = notice.category;
      const body = document.createElement('div');
      const title = document.createElement('h2');
      title.className = 'row-title';
      title.textContent = notice.title;
      const summary = document.createElement('p');
      summary.className = 'row-sum';
      summary.textContent = notice.body;
      body.append(title, summary);
      const author = document.createElement('div');
      author.className = 'home-notice-author';
      author.textContent = notice.author;
      article.append(tag, body, author);
      list.append(article);
    });
  });
})();
