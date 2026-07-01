import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgClass } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgClass, NavbarComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, OnDestroy {

  currentSlide = 0;
  private carouselTimer: any;

  heroSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=2071',
      alt: 'Fast Delivery to Every Village'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1586771107445-d3af9e150123?auto=format&fit=crop&q=80&w=2070',
      alt: 'Farming Essentials Sale'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1974',
      alt: 'Fresh Groceries Daily'
    }
  ];

  categoryCards = [
    {
      title: 'Farming Tools & Machinery',
      img: 'https://images.unsplash.com/photo-1592982537447-6f29efeb063b?w=500&q=80',
      link: 'Shop tools'
    },
    {
      title: 'Seeds & Fertilizers',
      img: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&q=80',
      link: 'See all supplies'
    },
    {
      title: 'Fresh Local Produce',
      img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80',
      link: 'Shop fresh'
    },
    {
      title: 'Livestock Care',
      img: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&q=80',
      link: 'View products'
    }
  ];

  productImages = [
    'https://images.unsplash.com/photo-1586771107445-d3af9e150123?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1592982537447-6f29efeb063b?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=60&w=300'
  ];

  ngOnInit(): void {
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  private startCarousel(): void {
    this.carouselTimer = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopCarousel(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide === this.heroSlides.length - 1)
      ? 0
      : this.currentSlide + 1;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide === 0)
      ? this.heroSlides.length - 1
      : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  fallbackImg(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1592982537447-6f29efeb063b?w=300&q=80';
  }
}