import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity('resumes')
export class Resume {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column({ type: 'json' })
	content!: Record<string, any>;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;
}
