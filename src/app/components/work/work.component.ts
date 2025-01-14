import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Tables } from '../../types/database.types';
import { WorkService } from '../../services/work/work.service';
import { DELETE, INSERT, UPDATE } from '../../constants/superbase/superbase.tables.constant';
import { ToastService } from '../../services/toast/toast.service';
import { Severity } from '../../types/common/toast/toast';
import { trigger, transition, style, animate } from '@angular/animations';
import { Status } from '../../services/common/status';

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrl: './work.component.css',
  animations: [
    trigger('enterAnimation', [
      transition(':enter', [
        style({  transform: 'translateY(1.2em)' }),
        animate('0.28s', style({ transform: 'translateY(0)' })),
      ])
    ])
  ]
})
export class WorkComponent implements OnInit {

  workList: Tables<'work'>[] | null | undefined;
  status: Status = Status.LOADING;
  Status = Status;

  constructor(private titleService: Title, private service : WorkService, private toastService: ToastService) {
    this.titleService.setTitle('Abhijit Unavane • SDE');
  }
  
  ngOnInit() {
    this.setupObservers();
  }

  async setupObservers(): Promise<void> {
    const {data, error} = await this.service.work();

    if (error !== null) {
      this.status = Status.ERROR;
      this.toastService.add({
        text: "Something went wrong!",
        severity: Severity.ERROR
      });
    } else if (data != null) {
      this.status = Status.SUCCESS;
      this.workList = data;
      this.workList?.map(async work => {
        if (work.image !== null) {
          const { data } = this.service.workImage(work.image);
          
          if (data !== null && data.publicUrl !== null) {
            work.image = data.publicUrl;
          }
        }
      });
    }
    
    this.service.workChanges().subscribe(update => {
      if (update !== null) {
        if (this.workList === undefined || this.workList === null) {
          return;
        }
        
        const newData = update.new;
        const oldData = update.old;
        switch (update.eventType) {
          case INSERT: {
            const work: Tables<'work'> = newData as Tables<'work'>;
            if (work.image !== null) {
              const { data } = this.service.workImage(work.image);
              if (data !== null && data.publicUrl !== null) {
                work.image = data.publicUrl;
              }
            }
            this.workList.push(work);
            break;
          }
          case UPDATE: {
            if (this.workList.length > 0) {
              this.workList.map((work, index) => {
                if (work.id === newData.id) {
                  const work: Tables<'work'> = newData as Tables<'work'>;
                  if (work.image !== null) {
                    const { data } = this.service.workImage(work.image);
                    if (data !== null && data.publicUrl !== null) {
                      work.image = data.publicUrl;
                    }
                  }
                  this.workList![index] = work;
                  return;
                }
              });
            }
            break;
          }
          case DELETE: {
            this.workList = this.workList.filter(work => work.id !== oldData.id);
            break;
          }
        }
      }
    });
  }
}
