import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DocItem {
  title: string;
  description: string;
  file: string;
}

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentation.html',
  styleUrls: ['./documentation.css'],
})
export class Documentation {
  docs: DocItem[] = [
    {
      title: 'Custom Merchandise Store – Project Overview',
      description: 'Project documentation for the Custom Merchandise Store application.',
      file: 'custom-merch-store.pdf',
    },
    {
      title: 'Entity-Relationship Diagram',
      description: 'Data model and relationships between entities in the Custom Merchandise Store database.',
      file: 'er-diagram.pdf',
    },
    {
      title: 'REST Endpoint Documentation',
      description: 'Comprehensive list of REST API endpoints for the Custom Merchandise Store backend.',
      file: 'rest-endpoints.pdf',
    },
        {
      title: 'Architecture Overview',
      description: 'High-level architecture and design principles of the Custom Merchandise Store application.',
      file: 'architecture.png',
    },
          {
      title: 'Project evaulation final form',
      description: 'Final project evaluation form for the Custom Merchandise Store application.',
      file: 'Project_Evaluation_Form_Final.pdf',
    },
  ];

  getUrl(doc: DocItem): string {
    return `/docs/${doc.file}`;
  }

  authors = [
  {
    name: 'Domagoj',
    img: '/domagoj.jpg',
    email: 'dvlahek23@student.foi.hr'
  },
  {
    name: 'Dmytro',
    img: '/dmytro.jpg',
    email: 'konskiidima@gmail.com'
  }
];
}
