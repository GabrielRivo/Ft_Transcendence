import { IsString, IsRequired, IsEnum, IsInt, MinLength, MaxLength, generateSchema } from 'my-class-validator';

export class CreateTournamentDto {
    @IsRequired()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    name!: string;

    @IsRequired()
    @IsInt()
    @IsEnum([4, 8, 16])
    size!: 4 | 8 | 16; // see later if we use power of 2 sizes

    @IsRequired()
    @IsEnum(['MANUAL', 'AUTO_FULL', 'AUTO_TIMER'])
    startMode!: 'MANUAL' | 'AUTO_FULL' | 'AUTO_TIMER';
}

export const CreateTournamentSchema = generateSchema(CreateTournamentDto);