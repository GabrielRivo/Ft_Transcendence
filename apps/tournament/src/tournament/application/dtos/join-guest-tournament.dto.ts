import { IsNumber, IsRequired } from "my-class-validator";

export class JoinGuestTournamentDto {
    @IsNumber()
    @IsRequired()
    otp!: number;
}
