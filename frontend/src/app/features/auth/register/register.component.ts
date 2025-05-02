// frontend/src/app/features/auth/register/register.component.ts
// SON HAL - YORUM SATIRSIZ

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] // veya .scss
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;

  constructor() { }

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      'name': new FormControl(null, Validators.required),
      'email': new FormControl(null, [Validators.required, Validators.email]),
      'password': new FormControl(null, [Validators.required /*, Validators.minLength(6) */]),
      'confirmPassword': new FormControl(null, Validators.required)
    },
    { validators: this.passwordsMatchValidator });

    // console.log('Initial Register Form Status:', this.registerForm.status);
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword || !password.value || !confirmPassword.value) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordsMismatch: true };
  };

  onSubmit(): void {
    console.log('Register Form Submitted!');

    if (this.registerForm.valid) {
      console.log('Form is valid');
      const registrationData = {
         name: this.registerForm.value.name,
         email: this.registerForm.value.email,
         password: this.registerForm.value.password
      };
      console.log('Form Values (to send):', registrationData);
      // TODO: AuthService.register(registrationData)...
    } else {
      console.log('Form is invalid');
      console.log('Form Errors:', this.registerForm.errors);
      // this.registerForm.markAllAsTouched();
    }
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
