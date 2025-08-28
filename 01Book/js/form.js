// 전역 변수
const API_BASE_URL = "http://localhost:8080";
// 현재 Update 중인 도서의 ID
var editingBookId = null;
// 원본 도서 데이터 (수정 전)
var originalBookData = null;

// DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");
const formErrorSpan = document.getElementById("formError");

// Document Load 이벤트 처리
document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});

// bookForm의 Submit 이벤트 처리
bookForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const bkFormData = new FormData(bookForm);
    const bookData = {
        title: bkFormData.get("title").trim(),
        author: bkFormData.get("author").trim(),
        isbn: bkFormData.get("isbn").trim(),
        price: bkFormData.get("price").trim(),
        publishDate: bkFormData.get("publishDate").trim(),
        detailRequest: {
            description: bkFormData.get("description").trim(),
            language: bkFormData.get("language").trim(),
            pageCount: bkFormData.get("pageCount").trim(),
            publisher: bkFormData.get("publisher").trim(),
            coverImageUrl: bkFormData.get("coverImageUrl").trim(),
            edition: bkFormData.get("edition").trim(),
        }
    };

    if (!validateBook(bookData)) return;

    // 수정 중인지 확인
    if (editingBookId) {
        updateBook(editingBookId, bookData, originalBookData);
    } else {
        createBook(bookData);
    }
});

// ------------------------------
// 도서 등록
// ------------------------------
function createBook(bookData) {
    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)
    })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '도서 등록에 실패했습니다.');
            }
            return response.json();
        })
        .then(result => {
            resetForm();
            showMessage("도서가 성공적으로 등록되었습니다!", "success");
            loadBooks();
        })
        .catch(error => showMessage(error.message, "error"));
}

// ------------------------------
// 도서 수정
// ------------------------------
function updateBook(bookId, bookData, originalData) {
    submitButton.disabled = true;
    submitButton.textContent = "수정 중...";

    // 변경 감지
    const payload = getPatchPayload(originalData, bookData);
    if (Object.keys(payload).length === 0) {
        showMessage("변경된 내용이 없습니다.", "error");
        submitButton.disabled = false;
        submitButton.textContent = "도서 수정";
        return;
    }

    // PATCH/PUT 결정
    const method = payload.detailRequest || Object.keys(payload).length < Object.keys(bookData).length ? "PATCH" : "PUT";

    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                const message = errorData.message || '도서 수정에 실패했습니다.';
                throw new Error(response.status === 409 ? `${message} (에러코드: 409)` : message);
            }
            return response.json();
        })
        .then(result => {
            showMessage("도서가 성공적으로 수정되었습니다!", "success");
            resetForm();
            loadBooks();
        })
        .catch(error => showMessage(error.message, "error"))
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = "도서 수정";
        });
}

// ------------------------------
// 변경된 필드만 추려내기
// ------------------------------
function getPatchPayload(originalBook, currentBook) {
    const patchPayload = {};

    if (originalBook.title !== currentBook.title) patchPayload.title = currentBook.title;
    if (originalBook.author !== currentBook.author) patchPayload.author = currentBook.author;
    if (originalBook.isbn !== currentBook.isbn) patchPayload.isbn = currentBook.isbn;
    if (originalBook.price != currentBook.price) patchPayload.price = currentBook.price;
    if (originalBook.publishDate !== currentBook.publishDate) patchPayload.publishDate = currentBook.publishDate;

    const detailPayload = {};
    if (originalBook.detail?.description !== currentBook.detailRequest.description)
        detailPayload.description = currentBook.detailRequest.description;
    if (originalBook.detail?.language !== currentBook.detailRequest.language)
        detailPayload.language = currentBook.detailRequest.language;
    if (originalBook.detail?.pageCount != currentBook.detailRequest.pageCount)
        detailPayload.pageCount = currentBook.detailRequest.pageCount;
    if (originalBook.detail?.publisher !== currentBook.detailRequest.publisher)
        detailPayload.publisher = currentBook.detailRequest.publisher;
    if (originalBook.detail?.coverImageUrl !== currentBook.detailRequest.coverImageUrl)
        detailPayload.coverImageUrl = currentBook.detailRequest.coverImageUrl;
    if (originalBook.detail?.edition !== currentBook.detailRequest.edition)
        detailPayload.edition = currentBook.detailRequest.edition;

    if (Object.keys(detailPayload).length > 0) {
        patchPayload.detailRequest = detailPayload;
    }

    return patchPayload;
}

// ------------------------------
// 도서 삭제
// ------------------------------
function deleteBook(bookId, bookTitle) {
    if (!confirm(`제목 = ${bookTitle} 도서를 정말로 삭제하시겠습니까?`)) return;

    fetch(`${API_BASE_URL}/api/books/${bookId}`, { method: 'DELETE' })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '도서 삭제에 실패했습니다.');
            }
            showMessage("도서가 성공적으로 삭제되었습니다!", "success");
            loadBooks();
        })
        .catch(error => showMessage(error.message, "error"));
}

// ------------------------------
// 도서 수정 전 데이터 로드
// ------------------------------
function editBook(bookId) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '존재하지 않는 도서입니다.');
            }
            return response.json();
        })
        .then(book => {
            resetForm();

            // Form에 데이터 채우기
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price;
            bookForm.publishDate.value = book.publishDate;
            if (book.detail) {
                bookForm.description.value = book.detail.description;
                bookForm.language.value = book.detail.language;
                bookForm.pageCount.value = book.detail.pageCount;
                bookForm.publisher.value = book.detail.publisher;
                bookForm.coverImageUrl.value = book.detail.coverImageUrl;
                bookForm.edition.value = book.detail.edition;
            }

            // 수정 Mode 설정
            editingBookId = bookId;
            originalBookData = book; // 원본 데이터 저장
            submitButton.textContent = "도서 수정";
            cancelButton.style.display = 'inline-block';
        })
        .catch(error => showMessage(error.message, "error"));
}

// ------------------------------
// Form 초기화
// ------------------------------
function resetForm() {
    bookForm.reset();
    editingBookId = null;
    originalBookData = null;
    submitButton.textContent = "도서 등록";
    cancelButton.style.display = 'none';
    hideMessage();
}

// ------------------------------
// 유효성 검사
// ------------------------------
function validateBook(book) {
    if (!book.title) { showMessage("제목을 입력해주세요."); bookForm.title.focus(); return false; }
    if (!book.author) { showMessage("저자를 입력해주세요."); bookForm.author.focus(); return false; }
    if (!/^\d{13}$/.test(book.isbn)) { showMessage("ISBN은 숫자(13자리)만 입력 가능합니다."); bookForm.isbn.focus(); return false; }
    if (!book.price) { showMessage("가격을 입력해주세요."); bookForm.price.focus(); return false; }

    const bd = book.detailRequest;
    if (!bd.description) { showMessage("Description을 입력해주세요."); bookForm.description.focus(); return false; }
    if (!bd.language) { showMessage("Language를 입력해주세요."); bookForm.language.focus(); return false; }
    if (!bd.pageCount) { showMessage("PageCount를 입력해주세요."); bookForm.pageCount.focus(); return false; }
    if (!bd.publisher) { showMessage("Publisher를 입력해주세요."); bookForm.publisher.focus(); return false; }
    if (!bd.coverImageUrl) { showMessage("CoverImageUrl을 입력해주세요."); bookForm.coverImageUrl.focus(); return false; }
    if (!bd.edition) { showMessage("Edition을 입력해주세요."); bookForm.edition.focus(); return false; }

    return true;
}

// ------------------------------
// 도서 목록 로드
// ------------------------------
function loadBooks() {
    fetch(`${API_BASE_URL}/api/books`)
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
            return response.json();
        })
        .then(books => renderBookTable(books))
        .catch(error => {
            showMessage(error.message, "error");
            bookTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#dc3545;">오류: 데이터를 불러올 수 없습니다.</td></tr>`;
        });
}

// ------------------------------
// 도서 테이블 렌더링
// ------------------------------
function renderBookTable(books) {
    bookTableBody.innerHTML = "";
    books.forEach(book => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${book.price}</td>
            <td>${book.publishDate}</td>
            <td>${book.detail?.description ?? "-"}</td>
            <td>${book.detail?.language ?? "-"}</td>
            <td>${book.detail?.pageCount ?? "-"}</td>
            <td>${book.detail?.publisher ?? "-"}</td>
            <td>${book.detail?.coverImageUrl ?? "-"}</td>
            <td>${book.detail?.edition ?? "-"}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id},'${book.title}')">삭제</button>
            </td>
        `;
        bookTableBody.appendChild(row);
    });
}

// ------------------------------
// 메시지 표시
// ------------------------------
function showMessage(message, type) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = 'block';
    if (type === "success") {
        formErrorSpan.style.color = '#28a745';
        formErrorSpan.style.backgroundColor = '#d4edda';
        formErrorSpan.style.borderColor = '#c3e6cb';
    } else {
        formErrorSpan.style.color = '#dc3545';
        formErrorSpan.style.backgroundColor = '#f8d7da';
        formErrorSpan.style.borderColor = '#f5c6cb';
    }
    setTimeout(hideMessage, 3000);
}

function hideMessage() {
    formErrorSpan.style.display = 'none';
    formErrorSpan.style.backgroundColor = '';
    formErrorSpan.style.borderColor = '';
}
