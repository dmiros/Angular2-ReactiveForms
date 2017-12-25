import { Component, OnInit, AfterViewInit, OnDestroy, ViewChildren, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, FormArray, Validators, FormControlName } from '@angular/forms';
import { ActivatedRoute, Router  } from '@angular/router';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/merge';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IProduct } from './product';
import { ProductService } from './product.service';

import { NumberValidators } from '../shared/number.validator';
import { GenericValidator } from '../shared/generic-validator';

@Component({
    templateUrl: 'app/products/product-edit.component.html'
})
export class ProductEditComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChildren(FormControlName, { read: ElementRef }) formInputElements: ElementRef[];

    pageTitle: string = 'Product Edit';
    errorMessage: string;
    productForm: FormGroup;

    product: IProduct;
    private sub: Subscription;

    // Use with the generic validation message class
    displayMessage: { [key: string]: string } = {};
    private validationMessages: { [key: string]: { [key: string]: string } };
    private genericValidator: GenericValidator;

    get tags(): FormArray {
        return <FormArray>this.productForm.get('tags');
    }

    constructor(private fb: FormBuilder,
                private route: ActivatedRoute,
                private router: Router,
                private productService: ProductService) {

        // Defines all of the validation messages for the form.
        // These could instead be retrieved from a file or database.
        this.validationMessages = {
            productName: {
                required: 'Product name is required.',
                minlength: 'Product name must be at least three characters.',
                maxlength: 'Product name cannot exceed 50 characters.'
            },
            productCode: {
                required: 'Product code is required.'
            },
            starRating: {
                range: 'Rate the product between 1 (lowest) and 5 (highest).'
            }
        };

        // Define an instance of the validator for use with this form, 
        // passing in this form's set of validation messages.
        this.genericValidator = new GenericValidator(this.validationMessages);
    }
    
    ngOnInit(): void {
        // this.customerForm= new FormGroup({
        //     firstName: new FormControl(),
        //     lastName: new FormControl(),
        //     email: new FormControl(),
        //     sendCatalog: newFormControl(true)});
        this.productForm = this.fb.group({
            // prvi element niza je objekat, u kome se prosledjuje difoltna vrednost i disabled stanje
            // drugi element niza je niz, u kome se prosledjuju validaciona pravila
            // treci element niza je niz, u kome se prosledjuju asinhrona validaciona pravila
            productName: ['', [Validators.required,
                               Validators.minLength(3),
                               Validators.maxLength(50)]],
            productCode: ['', Validators.required],
            starRating: ['', NumberValidators.range(1, 5)],
            // Kreira novi niz kontrola od zadatog niza stringova
            // this.productForm.setControl('tags', this.fb.array(this.product.tags || []));
            tags: this.fb.array([]),
            description: ''
        });
        // this.productForm.controls.productName.enable();

        // valueChanges emituje event-e svaki put kada se promeni vrednost
        // ako zelimo da posmatramo te promene Priijavljujemo se na valueChanges observable
        // this.customerForm.get('notification').valueChanges
        //              .subscribe(value => this.setNotification(value));

        // const emailControl = this.customerForm.get('emailGroup.email');
        // emailControl.valueChanges.debounceTime(1000).subscribe(value =>
        // this.setMessage(emailControl));

        // Read the product Id from the route parameter

        // Read the product Id from the route parameter
        this.sub = this.route.params.subscribe(
            params => {
                let id = +params['id'];
                this.getProduct(id);
            }
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    ngAfterViewInit(): void {
        // Watch for the blur event from any input element on the form.
        let controlBlurs: Observable<any>[] = this.formInputElements
            .map((formControl: ElementRef) => Observable.fromEvent(formControl.nativeElement, 'blur'));

        // Merge the blur event observable with the valueChanges observable
        Observable.merge(this.productForm.valueChanges, ...controlBlurs).debounceTime(800).subscribe(value => {
            this.displayMessage = this.genericValidator.processMessages(this.productForm);
        });
    }

    addTag(): void {
        this.tags.push(new FormControl());
    }

    getProduct(id: number): void {
        // ProductEditComponent.getProduct
        //        productService.getProduct
        //               productService.extractData(xx)
        // test
        this.productService.getProduct(id)
        .do(data => console.log('ProductEditComponent.getProduct: ' + JSON.stringify(data)))
            .subscribe(
                (product: IProduct) => this.onProductRetrieved(product),
                (error: any) => this.errorMessage = <any>error
            );
    }

    onProductRetrieved(product: IProduct): void {
        console.log('ProductEditComponent.onProductRetrieved: ');
        // Ako je forma vec bila u upotrebi kada smo je pozvali, resetujemo je
        // touched, dirty, ... tagovi se brisu pre nego sto se pokazu novopristigli podaci o proiyvodu sa servera
        if (this.productForm) {
            this.productForm.reset();
        }
        this.product = product;

        if (this.product.id === 0) {
            this.pageTitle = 'Add Product';
        } else {
            this.pageTitle = `Edit Product: ${this.product.productName}`;
        }

        // Update the data on the form
        // patchValue - postavlja vrednosti u nekoliko konrola na stranici
        // setValue - postavlja vrednosti u svim konrolama na stranici
        this.productForm.patchValue({
            productName: this.product.productName,
            productCode: this.product.productCode,
            starRating: this.product.starRating,
            description: this.product.description
        });
        // za niz kontrola, koristi se setControl metoda
        this.productForm.setControl('tags', this.fb.array(this.product.tags || []));
    }

    deleteProduct(): void {
        if (this.product.id === 0) {
            // Don't delete, it was never saved.
            this.onSaveComplete();
       } else {
            if (confirm(`Really delete the product: ${this.product.productName}?`)) {
                this.productService.deleteProduct(this.product.id)
                    .subscribe(
                        () => this.onSaveComplete(),
                        (error: any) => this.errorMessage = <any>error
                    );
            }
        }
    }

    saveProduct(): void {
        if (this.productForm.dirty && this.productForm.valid) {
            // Copy the form values over the product object values
            let p = Object.assign({}, this.product, this.productForm.value);

            this.productService.saveProduct(p)
                .subscribe(
                    () => this.onSaveComplete(),
                    (error: any) => this.errorMessage = <any>error
                );
        } else if (!this.productForm.dirty) {
            this.onSaveComplete();
        }
    }

    onSaveComplete(): void {
        // Reset the form to clear the flags
        this.productForm.reset();
        this.router.navigate(['/products']);
    }
}
