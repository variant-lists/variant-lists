import { UseCaseError } from "@src/core/errors/use-case-error";

export class ItemMismatchSchema extends UseCaseError {
	constructor() {
		super("Item mismatch schema");
	}
}
