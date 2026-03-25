import Link from "next/link";

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#008080] to-[#00f5f5] text-black px-6 py-10 md:px-20 ">
      <div className="bg-gradient-to-br from-white to-gray-100 p-20 m-20 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold font-dancing text-[#008080] mb-6 text-center">PrivaFed: A Privacy-Preserving Federated Learning Framework – Documentation</h1>
        <hr className="pb-3 border-black"></hr>

        <section className="mb-10">
  <h2 className="text-2xl font-semibold font-dancing text-[#008080] mb-2">Project Vision</h2>
  <p className="text-base leading-7">
    PrivaFed is designed to be a privacy-preserving federated learning framework for collaborative stroke lesion segmentation on brain MRI scans. It combines federated learning (FL) with transfer learning (TL) to provide secure, efficient, and personalized model training across multiple healthcare institutions.
  </p>
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Problem Domain Overview</h3>
  <p className="text-base leading-7">
    PrivaFed enables distributed model training while keeping sensitive patient data local to each hospital or research center. Only model updates are shared with a central server, ensuring privacy. The framework handles challenges such as heterogeneous datasets, resource limitations at client sites, and communication costs, providing a reliable second opinion for stroke segmentation through lightweight models and TL.
  </p>
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Problem Statement</h3>
  <p className="text-base leading-7">
    Centralized training approaches are infeasible in healthcare due to privacy restrictions. The combination of FL with TL for stroke analysis remains largely unexplored. PrivaFed addresses this gap by offering a framework that preserves patient data privacy while minimizing computation costs and enabling practical deployment in real-world clinical environments.
  </p>
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Challenges & Limitations</h3>
  <ul className="list-disc list-inside text-base leading-7">
    <li><strong>Privacy Risks:</strong> Centralized models require pooling sensitive patient data, which is unsafe.</li>
    <li><strong>Lack of Transfer Learning:</strong> Models trained from scratch waste resources. TL can optimize performance on small datasets but is rarely applied in federated setups.</li>
    <li><strong>Demand for Lightweight Models:</strong> Healthcare devices often have limited computing power, requiring efficient architectures.</li>
    <li><strong>Handling Data Imbalance:</strong> Stroke lesion datasets are heterogeneous and unevenly distributed, which can hurt model performance.</li>
    <li><strong>Lack of Personalization:</strong> A single global model may not generalize well across different patient populations or institutions.</li>
  </ul>
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Goals and Objectives</h3>
  <ul className="list-disc list-inside text-base leading-7">
    <li><strong>Privacy Preservation:</strong> Enable collaborative model training without sharing raw data.</li>
    <li><strong>Personalization:</strong> Adapt models to heterogeneous and imbalanced datasets.</li>
    <li><strong>Lightweight Design:</strong> Reduce computational and communication costs.</li>
    <li><strong>Optimized Model Updates:</strong> Improve training efficiency with smart aggregation strategies.</li>
    <li><strong>Transfer Learning:</strong> Use pretrained models to accelerate convergence and improve accuracy.</li>
  </ul>
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Project Scope</h3>
  <p className="text-base leading-7"><strong>Research Phase:</strong> Literature review, dataset evaluation, preprocessing, TL techniques, and performance metrics.</p>
  <p className="text-base leading-7 mt-2"><strong>Development Phase:</strong> Collect datasets, implement FL framework, apply TL, handle data heterogeneity, design lightweight models, optimize updates, conduct experiments, and create a user-friendly interface for real-time segmentation results.</p>
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Alignment with Sustainable Development Goals (SDG)</h3>
  <p className="text-base leading-7">
    PrivaFed aligns with <strong>SDG 3: Good Health and Well-Being</strong> by enabling scalable and privacy-preserving stroke diagnosis. It tackles challenges such as data privacy, limited computational power, and heterogeneous medical datasets to improve healthcare outcomes and promote overall well-being.
  </p>
  <img src="/SDG 3.png" alt="SDG 3: Good Health and Well-Being" className="w-1/4 mt-4" />
</section>

<section className="mb-10">
  <h3 className="text-xl font-semibold font-dancing text-[#008080] mb-2">Constraints</h3>
  <ul className="list-disc list-inside text-base leading-7">
    <li>Limited access to high-quality, diverse brain scan datasets.</li>
    <li>Computational resource limitations for training deep learning models.</li>
    <li>Time constraints for experimentation and validation during the FYP.</li>
  </ul>
</section>

        <footer className="border-t pt-6 text-sm text-center text-gray-500">
          <p>© 2025 Privafed. All rights reserved.</p>
          <p>
            <Link href="https://github.com/NoorUlAin-Asghar/Nexium_NoorUlAinAsghar" className="text-[#008080] underline">
              View on GitHub
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
