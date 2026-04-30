import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	OneToOne,
	JoinColumn,
} from 'typeorm';
import { Resume } from '../../resume/entities/resume.entity';

@Entity('job_analysis')
export class JobAnalysis {
	@PrimaryGeneratedColumn()
	id!: number;

	@OneToOne(() => Resume)
	@JoinColumn()
	resumeId!: number;

	@Column()
	companyName!: string;

	@Column()
	title!: string;

	@Column()
	description!: string;

	@Column({ nullable: true })
	location?: string;

	@Column({ nullable: true })
	salary?: number;

	@Column()
	url!: string;

	@Column()
	score!: number;

	@Column({ type: 'json' })
	analysis!: Record<string, any>;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;
}
