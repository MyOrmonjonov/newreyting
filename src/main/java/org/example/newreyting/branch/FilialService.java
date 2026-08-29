package org.example.newreyting.branch;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FilialService {

    private final FilialRepository filialRepository;

    public FilialService(FilialRepository filialRepository) {
        this.filialRepository = filialRepository;
    }

    public List<Filial> list() {
        return filialRepository.findAllByOrderByNomiAsc();
    }

    @Transactional
    public Filial create(String nomi) {
        if (filialRepository.existsByNomiIgnoreCase(nomi)) {
            throw new IllegalArgumentException("Bu filial nomi band: " + nomi);
        }
        return filialRepository.save(new Filial(nomi.trim()));
    }
}
