import axios from "axios";

export default class RegistrationForm {
  constructor() {
    this.form = document.querySelector("#registeration-form");
    this.allFields = document.querySelectorAll(
      "#registration-form .form-control"
    );
    this.username = document.querySelector("#username-register");
    this.email = document.querySelector("#email-register");
    this.password = document.querySelector("#password-register");
    this.username.previousValue = "";
    this.email.previousValue = "";
    this.password.previousValue = "";
    this.insertValidationHTML();
    this.username.isUnique = false;
    this.email.isUnique = false;
    this.events();
  }

  //events

  events() {
    this.form.addEventListener("submit", e => {
      e.preventDefault();
      this.formSubmitHandler();
    });

    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler);
    });

    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler);
    });

    this.password.addEventListener("key", () => {
      this.isDifferent(this.password, this.passwordHandler);
    });
  }

  //methods
  isDifferent(el, handler) {
    if (el.previousValue != el.value) {
      handler.call(this);
    }
    el.previousValue = el.value;
  }

  usernameHandler() {
    this.username.errors = false;
    this.usernameImmediately();
    clearTimeout(this.username.timer);
    this.username.timer = setTimeout(() => {
      this.usernameAfterDelay();
    }, 1200);
  }

  passwordHandler() {
    this.password.errors = false;
    this.passwordImmediately();
    clearTimeout(this.password.timer);
    this.password.timer = setTimeout(() => {
      this.passwordAfterDelay();
    }, 1200);
  }

  emailHandler() {
    this.email.errors = false;
    clearTimeout(this.email.timer);
    this.email.timer = setTimeout(() => {
      this.emailAfterDelay();
    }, 1300);
  }

  passwordImmediately() {
    if (this.password.value.length > 30) {
      this.showValidationError(
        this.password,
        "password cannot exceed 30 characters"
      );
    }

    if (!this.password.errors) {
      this.hideValidationError(this.password);
    }
  }

  passowordAfterDelay() {
    if (this.password.value.length < 8) {
      this.showValidationError(
        this.password,
        "password should be atleast 8 characters long"
      );
    }
  }

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(
        this.email,
        "You must provide an valid email address"
      );
    }

    if (!this.email.errors) {
      axios
        .post("/doesEmailExist", { email: this.email.value })
        .then(response => {
          if (response.data) {
            this.email.isUnique = false;
            this.showValidationError(this.email, "Email already in use");
          } else {
            this.email.isUnique = true;
            this.hideValidationError(this.email);
          }
        })
        .catch(() => {
          console.log("please try again after sometime");
        });
    }
  }

  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(
        this.username,
        "username cannot be less than 3 characters"
      );
    }

    if (!this.username.errors) {
      axios
        .post("/doesUsernameExist", { username: this.username.value })
        .then(response => {
          if (response.data) {
            this.showValidationError(this.username, "Username already taken");
            this.username.isUnique = false;
          } else {
            this.hideValidationError(this.username);
            this.username.isUnique = true;
          }
        })
        .catch(() => {
          console.log("please try again later");
        });
    }
  }

  usernameImmediately() {
    if (
      this.username.value != "" &&
      !/^([a-zA-z0-9]+)$/.test(this.username.value)
    ) {
      this.showValidationError(
        this.username,
        "Username can only contain alphabets and numbers"
      );
    }

    if (this.username.value.length > 30) {
      this.showValidationError(
        this.username,
        "username cannot exceed 30 characters"
      );
    }

    if (!this.username.errors) {
      this.hideValidationError(this.username);
    }
  }

  formSubmitHandler() {
    this.usernameImmediately();
    this.usernameAfterDelay();
    this.emailAfterDelay();
    this.passwordImmediately();
    this.passwordAfterDelay();

    if (
      this.username.isUnique &&
      !this.username.errors &&
      this.email.isUnique &&
      !this.email.errors &&
      !this.password.errors
    ) {
      this.form.submit();
    }
  }

  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message;
    el.nextElementSibling.classList.add("liveValidateMessage--visible");
    el.errors = true;
  }

  hideValidationError(el) {
    el.nextElementSibling.classList.remove("liveValidateMessage--visible");
  }

  insertValidationHTML() {
    this.allFields.forEach(el => {
      el.insertAdjacentHTML(
        "afterend",
        `
      <div class="alert alert-danger small liveValidateMessage">

      </div>
      `
      );
    });
  }
}
