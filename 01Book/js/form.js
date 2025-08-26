//전역변수
const API_BASE_URL = "http://localhost:8080";

//DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");

//Document Load 이벤트 처리하기
document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});
//bookForm 의 Submit 이벤트 처리하기
bookForm.addEventListener("submit", function (event) {
    //기본으로 설정된 Event가 동작하지 않도록 하기 위함
    event.preventDefault();
    console.log("Form 이 체출 되었음....")

    //FormData 객체생성 <form>엘리먼트를 객체로 변환
    const bkFormData = new FormData(bookForm);


    //사용자 정의 book Object Literal 객체생성 (공백 제거 trim())
    const bookData = {
        title: bkFormData.get("title").trim(),
        author: bkFormData.get("author").trim(),
        isbn: bkFormData.get("isbn").trim(),
        price: bkFormData.get("price").trim(),
        publishDate: bkFormData.get("publishDate").trim(),
        description: bkFormData.get("description").trim(),
        language: bkFormData.get("language").trim(),
        pageCount: bkFormData.get("pageCount").trim(),
        publisher: bkFormData.get("publisher").trim(),
        coverImageUrl: bkFormData.get("coverImageUrl").trim(),
        edition: bkFormData.get("edition").trim(),
    }

    //유효성 체크하는 함수 호출하기
    if (!validateBook(bookData)) {
        //검증체크 실패하면 리턴하기
        return;
    }

    //유효한 데이터 출력하기
    console.log(bookData);

}); //submit 이벤트

//입력항목의 값의 유효성을 체크하는 함수
function validateBook(book) {// 필수 필드 검사
    if (!book.title) {
        alert("제목을 입력해주세요.");
        return false;
    }

    if (!book.author) {
        alert("저자를 입력해주세요.");
        return false;
    }
    // ISBN 형식 검사 (예: 영문과 숫자 조합)

    const bookIsbnPattern = /^\d{13}$/;
    if (!bookIsbnPattern.test(book.isbn)) {
        alert("ISBN은 숫자(13자리)만 입력 가능합니다.");
        return false;
    }

    if (!book.price) {
        alert("가격을 입력해주세요.");
        return false;
    }
    if (!book.description) {
        alert("Description을 입력해주세요.");
        return false;
    }
    if (!book.language) {
        alert("language를 입력해주세요.");
        return false;
    }
    if (!book.pageCount) {
        alert("pageCount를 입력해주세요.");
        return false;
    }
    if (!book.publisher) {
        alert("publisher를 입력해주세요.");
        return false;
    }
    if (!book.coverImageUrl) {
        alert("coverImageUrl을 입력해주세요.");
        return false;
    }
    if (!book.edition) {
        alert("edition을 입력해주세요.");
        return false;
    }
    return true;
}

//book 목록을 Load 하는 함수
function loadBooks() {
    console.log("도서 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/books`) //Promise
        .then((response) => {
            if (!response.ok) {
                throw new Error("도서 목록을 불러오는데 실패했습니다!.");
            }
            return response.json();
        })
        .then((books) => renderBookTable(books))
        .catch((error) => {
            console.log("Error: " + error);
            alert("도서 목록을 불러오는데 실패했습니다!.");
        });
};

function renderBookTable(books) {
    console.log(books);
    bookTableBody.innerHTML = "";

    books.forEach((book) => {
        //<tr> 엘리먼트를 생성하기
        const row = document.createElement("tr");

        //<tr>의 content을 동적으로 생성
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
                        <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
                    </td>
                `;
        //<tbody>의 아래에 <tr>을 추가시켜 준다.
        bookTableBody.appendChild(row);
    });

}//renderBookTable