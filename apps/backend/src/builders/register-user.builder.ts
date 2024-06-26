import PrismaUserRepository from "@src/database/prisma/repositories/prisma-user.repository";
import { BcryptHasher } from "@src/services/bcrypt-hasher.service";
import { HashGenerator, RegisterUser } from "@variant-lists/domain";

export default class RegisterUserBuilder {
	prismaUserRepository: PrismaUserRepository;
	bcryptHasher: HashGenerator;
	constructor() {
		this.prismaUserRepository = new PrismaUserRepository();
		this.bcryptHasher = new BcryptHasher();
	}

	build() {
		return new RegisterUser(this.prismaUserRepository, this.bcryptHasher);
	}
}
